chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadIcon') {
    console.log('Background: 收到下载请求', request);

    // 直接使用原始 URL 进行下载
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError);
        sendResponse({ 
          success: false, 
          error: chrome.runtime.lastError.message || '下载失败'
        });
      } else {
        console.log('下载成功，downloadId:', downloadId);
        sendResponse({ success: true, downloadId });
      }
    });

    // 保持消息通道开放
    return true;
  }
});
