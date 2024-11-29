document.addEventListener('DOMContentLoaded', function() {
  // 获取所有打开的标签页
  chrome.tabs.query({}, function(tabs) {
    const tabList = document.getElementById('tabList');
    
    tabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'tab-item';
      
      // 创建图标元素
      const icon = document.createElement('img');
      icon.className = 'tab-icon';
      icon.src = tab.favIconUrl || 'images/default-icon.png';
      
      // 创建标题元素
      const title = document.createElement('span');
      title.className = 'tab-title';
      title.textContent = tab.title;
      
      // 创建查看图标按钮
      const viewButton = document.createElement('button');
      viewButton.className = 'view-icon-btn';
      viewButton.textContent = '查看图标';
      viewButton.onclick = function() {
        // 获取当前标签页的图标信息
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
              title.textContent = '可用图标列表';
              title.style.margin = '3px 0';
              
              const buttonGroup = document.createElement('div');
              buttonGroup.className = 'button-group';
              
              const closeBtn = document.createElement('button');
              closeBtn.textContent = '关闭';
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
              loadingText.textContent = '加载中...';
              loadingContainer.appendChild(spinner);
              loadingContainer.appendChild(loadingText);
              content.appendChild(loadingContainer);

              const iconsContainer = document.createElement('div');
              iconsContainer.className = 'icons-container';
              content.appendChild(iconsContainer);
              dialog.appendChild(content);

              document.body.appendChild(dialog);
              dialog.showModal();

              // 点击空白处关闭
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
                    
                    const downloadBtn = document.createElement('button');
                    downloadBtn.textContent = '下载';
                    downloadBtn.className = 'download-btn';
                    downloadBtn.onclick = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const a = document.createElement('a');
                      a.href = icon.url;
                      a.download = `icon-${icon.type || 'unknown'}.png`;
                      a.click();
                    };

                    container.appendChild(img);
                    container.appendChild(info);
                    container.appendChild(downloadBtn);
                    return container;
                  })
              )).then(containers => {
                // 移除加载状态
                loadingContainer.remove();

                // 对容器进行排序
                containers.sort((a, b) => {
                  const getNumber = (container) => {
                    const span = container.querySelector('span');
                    if (!span) return -1;
                    const match = span.textContent.match(/\d+/);
                    return match ? parseInt(match[0]) : -1;
                  };

                  const numA = getNumber(a);
                  const numB = getNumber(b);

                  // 如果都没有数字，保持原顺序
                  if (numA === -1 && numB === -1) return 0;
                  // 如果只有一个有数字，有数字的排在前面
                  if (numA === -1) return 1;
                  if (numB === -1) return -1;
                  // 如果都有数字，按数字从大到小排序
                  return numB - numA;
                });

                // 添加排序后的图标
                containers.forEach(container => {
                  iconsContainer.appendChild(container);
                });
              })
              .catch(error => {
                // 处理错误情况
                loadingContainer.remove();
                const errorMsg = document.createElement('div');
                errorMsg.textContent = '加载图标时出现错误';
                errorMsg.style.textAlign = 'center';
                errorMsg.style.color = '#666';
                errorMsg.style.padding = '20px';
                iconsContainer.appendChild(errorMsg);
              });
            } else {
              // 如果没有找到其他图标，就打开当前图标
              const iconUrl = tab.favIconUrl;
              if (iconUrl) {
                window.open(iconUrl, '_blank');
              } else {
                alert('该页面没有图标！');
              }
            }
          }
        });
      }
      
      // 将元素添加到tab项中
      tabItem.appendChild(icon);
      tabItem.appendChild(title);
      tabItem.appendChild(viewButton);
      
      // 将tab项添加到列表中
      tabList.appendChild(tabItem);
    });
  });
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
