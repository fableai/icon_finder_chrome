function checkI18nMessages() {
  const requiredMessages = ['viewIcon', 'availableIcons', 'close', 'loading', 'download', 'newWindow', 'downloadFailedRetry', 'downloadFailed', 'noIconFound', 'loadError'];
  return requiredMessages.every(msg => {
    const message = chrome.i18n.getMessage(msg);
    return message && message.length > 0;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  function initializeUI() {
    if (!checkI18nMessages()) {
      console.error('Required i18n messages not available');
      setTimeout(initializeUI, 100); // Retry after a short delay
      return;
    }

    initializeLanguageSelector();
    initializeTabList();
  }

  function initializeLanguageSelector() {
    chrome.storage.local.get('preferred_language', function(data) {
      if (data.preferred_language) {
        document.getElementById('languageSelect').value = data.preferred_language;
      }
    });

    document.getElementById('languageSelect').addEventListener('change', function(e) {
      const lang = e.target.value;
      chrome.storage.local.set({ 'preferred_language': lang }, function() {
        chrome.runtime.reload();
      });
    });
  }

  function initializeTabList() {
    chrome.tabs.query({}, function(tabs) {
      const tabList = document.getElementById('tabList');
      tabList.innerHTML = '';

      tabs.forEach(tab => {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';

        const icon = document.createElement('img');
        icon.className = 'tab-icon';
        icon.src = tab.favIconUrl || 'images/default-icon.png';

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;

        const viewButton = document.createElement('button');
        viewButton.className = 'view-icon-btn';
        viewButton.textContent = chrome.i18n.getMessage('viewIcon');
        viewButton.onclick = function() {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: findHighResIcons,
          }, (results) => {
            if (results && results[0] && results[0].result) {
              const icons = results[0].result;
              if (icons.length > 0) {
                const dialog = document.createElement('dialog');
                dialog.className = 'icon-dialog';

                const header = document.createElement('div');
                header.className = 'dialog-header';

                const title = document.createElement('h3');
                title.textContent = chrome.i18n.getMessage('availableIcons');
                title.style.margin = '3px 0';

                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'button-group';

                const closeBtn = document.createElement('button');
                closeBtn.textContent = chrome.i18n.getMessage('close');
                closeBtn.className = 'close-btn';
                closeBtn.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dialog.remove();
                };

                buttonGroup.appendChild(closeBtn);

                header.appendChild(title);
                header.appendChild(buttonGroup);
                dialog.appendChild(header);

                const content = document.createElement('div');
                content.className = 'dialog-content';

                const loadingContainer = document.createElement('div');
                loadingContainer.className = 'loading-container';
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                const loadingText = document.createElement('p');
                loadingText.textContent = chrome.i18n.getMessage('loading');
                loadingContainer.appendChild(spinner);
                loadingContainer.appendChild(loadingText);
                content.appendChild(loadingContainer);

                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';
                content.appendChild(iconsContainer);
                dialog.appendChild(content);

                document.body.appendChild(dialog);
                dialog.showModal();

                dialog.addEventListener('click', (e) => {
                  if (e.target === dialog) {
                    dialog.remove();
                  }
                });

                Promise.all(icons.map(icon =>
                  fetch(icon.url)
                    .then(response => {
                      if (!response.ok) throw new Error('Network response was not ok');
                      return response;
                    })
                    .then(() => {
                      const container = document.createElement('div');
                      container.className = 'icon-container';
                      container.onclick = (e) => {
                        e.stopPropagation();
                      };

                      const img = document.createElement('img');
                      img.src = icon.url;
                      img.onclick = (e) => {
                        e.stopPropagation();
                        window.open(icon.url, '_blank');
                      };
                      img.onload = () => {
                        img.classList.add('loaded');
                      };

                      const infoText = [];
                      if (icon.type) infoText.push(icon.type);
                      if (icon.size) infoText.push(`${icon.size}x${icon.size}`);

                      const info = document.createElement('span');
                      info.textContent = infoText.join(' - ');

                      const buttonGroup = document.createElement('div');
                      buttonGroup.className = 'button-group';

                      const downloadBtn = document.createElement('button');
                      downloadBtn.textContent = chrome.i18n.getMessage('download');
                      downloadBtn.className = 'download-btn';
                      downloadBtn.onclick = (e) => {
                        console.log('下载按钮被点击');
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('准备下载URL:', icon.url);

                        const urlObj = new URL(icon.url);
                        const urlFilename = urlObj.pathname.split('/').pop();

                        let filename = urlFilename;
                        if (!filename.match(/\.(png|jpg|jpeg|ico|svg|gif)$/i)) {
                          filename += '.png';
                        }

                        const timestamp = new Date().getTime();
                        filename = `icon_${timestamp}_${filename}`;

                        console.log('开始下载，文件名:', filename);

                        chrome.runtime.sendMessage({
                          action: 'downloadIcon',
                          url: icon.url,
                          filename: filename
                        }, (response) => {
                          if (!response) {
                            console.error('下载失败: 没有收到响应');
                            alert(chrome.i18n.getMessage('downloadFailedRetry'));
                            return;
                          }

                          if (chrome.runtime.lastError) {
                            console.error('消息发送失败:', chrome.runtime.lastError);
                            alert(chrome.i18n.getMessage('downloadFailedRetry'));
                          } else if (!response.success) {
                            console.error('下载失败:', response.error);
                            alert(chrome.i18n.getMessage('downloadFailed') + ': ' + response.error);
                          } else {
                            console.log('下载成功，downloadId:', response.downloadId);
                          }
                        });

                        return false;
                      };

                      const openBtn = document.createElement('button');
                      openBtn.textContent = chrome.i18n.getMessage('newWindow');
                      openBtn.className = 'open-btn';
                      openBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        chrome.tabs.create({ url: icon.url });
                      };

                      buttonGroup.appendChild(downloadBtn);
                      buttonGroup.appendChild(openBtn);

                      container.appendChild(img);
                      container.appendChild(info);
                      container.appendChild(buttonGroup);
                      return container;
                    })
                )).then(containers => {
                  loadingContainer.remove();

                  containers.sort((a, b) => {
                    const getNumber = (container) => {
                      const span = container.querySelector('span');
                      if (!span) return -1;
                      const match = span.textContent.match(/\d+/);
                      return match ? parseInt(match[0]) : -1;
                    };

                    const numA = getNumber(a);
                    const numB = getNumber(b);

                    if (numA === -1 && numB === -1) return 0;
                    if (numA === -1) return 1;
                    if (numB === -1) return -1;
                    return numB - numA;
                  });

                  containers.forEach(container => {
                    iconsContainer.appendChild(container);
                  });
                })
                .catch(error => {
                  loadingContainer.remove();
                  const errorMsg = document.createElement('div');
                  errorMsg.textContent = chrome.i18n.getMessage('loadError');
                  errorMsg.style.textAlign = 'center';
                  errorMsg.style.color = '#666';
                  errorMsg.style.padding = '20px';
                  iconsContainer.appendChild(errorMsg);
                });
              } else {
                const iconUrl = tab.favIconUrl;
                if (iconUrl) {
                  window.open(iconUrl, '_blank');
                } else {
                  alert(chrome.i18n.getMessage('noIconFound'));
                }
              }
            }
          });
        }

        tabItem.appendChild(icon);
        tabItem.appendChild(title);
        tabItem.appendChild(viewButton);

        tabList.appendChild(tabItem);
      });
    });
  }

  initializeUI();
});

// 在页面中查找高清图标的函数
function findHighResIcons() {
  const icons = [];
  
  // 检查 manifest 链接
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    icons.push({
      url: manifestLink.href,
      type: 'manifest'
    });
  }

  // 检查所有图标相关的 link 标签
  const iconLinks = document.querySelectorAll('link[rel*="icon"]');
  iconLinks.forEach(link => {
    icons.push({
      url: link.href,
      size: link.sizes ? link.sizes.value : null,
      type: link.rel
    });
  });

  // 检查苹果设备图标
  const appleIcons = document.querySelectorAll('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]');
  appleIcons.forEach(link => {
    icons.push({
      url: link.href,
      size: link.sizes ? link.sizes.value : null,
      type: 'apple-touch-icon'
    });
  });

  // 检查 Open Graph 图标
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    icons.push({
      url: ogImage.content,
      type: 'og:image'
    });
  }

  return icons;
}

// 添加 showToast 函数到文件末尾
function showToast(message) {
  // 移除现有的 toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 创建新的 toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 触发重排以启动动画
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 3秒后隐藏并移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
