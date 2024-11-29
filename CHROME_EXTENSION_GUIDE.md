# Chrome Extension Development Guide
# Chrome 插件开发指南

A comprehensive guide for Chrome extension development, based on real project experience.

基于实际项目经验总结的 Chrome 扩展开发指南。

## Table of Contents 目录

- [Project Structure 项目结构](#project-structure-项目结构)
- [Manifest V3 Best Practices Manifest V3 最佳实践](#manifest-v3-best-practices)
- [Code Patterns 代码模式](#code-patterns-代码模式)
- [Security 安全性](#security-安全性)
- [Performance 性能优化](#performance-性能优化)
- [Development Tools 开发工具](#development-tools-开发工具)
- [Debugging 调试技巧](#debugging-调试技巧)
- [Internationalization 国际化](#internationalization-国际化)

## Project Structure 项目结构

推荐的项目结构组织方式：

```
extension/
├── manifest.json     # 配置文件
├── popup/           # 弹出窗口相关
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/      # 后台脚本
│   └── background.js
├── content/        # 内容脚本
│   └── content.js
├── images/         # 图标资源
└── utils/          # 通用工具函数
```

## Manifest V3 Best Practices

### 基本配置模板

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0",
  "description": "Extension Description",
  "permissions": [
    "tabs",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "images/icon16.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    }
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 权限最佳实践

- 遵循最小权限原则
- 明确区分 permissions 和 host_permissions
- 按需申请权限，避免过度授权

## Code Patterns 代码模式

### 消息通信

```javascript
// 发送消息
chrome.runtime.sendMessage({
  type: 'ACTION_TYPE',
  data: payload
}, response => {
  console.log('Response:', response);
});

// 接收消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ACTION_TYPE') {
    // 处理消息
    sendResponse({success: true});
  }
  return true; // 保持消息通道开启
});
```

### 异步操作处理

```javascript
// 异步操作包装器
async function chromeAsync(method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

// 使用示例
try {
  const tabs = await chromeAsync(chrome.tabs.query, {active: true});
  console.log('Active tabs:', tabs);
} catch (error) {
  console.error('Failed to get tabs:', error);
}
```

## Security 安全性

### XSS 防护

```javascript
// HTML 内容净化
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 数据验证
function validateInput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input');
  }
  // 添加更多验证规则
}
```

### CSP 配置

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

## Performance 性能优化

### 防抖函数

```javascript
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
```

### 缓存机制

```javascript
const cache = new Map();

async function getCachedData(key) {
  if (!cache.has(key)) {
    cache.set(key, await fetchData(key));
  }
  return cache.get(key);
}
```

## Development Tools 开发工具

### 构建脚本示例

```bash
#!/bin/bash

# build.sh
echo "Building extension..."

# 清理构建目录
rm -rf build/
mkdir build/

# 复制必要文件
cp manifest.json build/
cp -r images/ build/

# 压缩 JS/CSS（需要安装相关工具）
uglifyjs popup.js -o build/popup.js
cleancss -o build/popup.css popup.css

echo "Build completed!"
```

## Debugging 调试技巧

### Console 日志

```javascript
// 添加标识符的日志
const DEBUG = true;
function log(...args) {
  if (DEBUG) {
    console.log('[ExtensionName]', ...args);
  }
}

// 使用示例
log('Debug message');
```

### 开发者工具配置

在 manifest.json 中添加：
```json
{
  "devtools_page": "devtools.html"
}
```

## Internationalization 国际化

### 消息配置

```json
// _locales/en/messages.json
{
  "extensionName": {
    "message": "Extension Name",
    "description": "The name of the extension"
  },
  "extensionDescription": {
    "message": "Extension Description",
    "description": "The description of the extension"
  }
}

// _locales/zh/messages.json
{
  "extensionName": {
    "message": "扩展名称",
    "description": "扩展的名称"
  },
  "extensionDescription": {
    "message": "扩展描述",
    "description": "扩展的描述"
  }
}
```

### 使用国际化消息

```javascript
// 在 JavaScript 中使用
const extensionName = chrome.i18n.getMessage('extensionName');

// 在 HTML 中使用
<span data-i18n="extensionName"></span>

// 自动替换 HTML 中的国际化消息
document.querySelectorAll('[data-i18n]').forEach(element => {
  const message = element.getAttribute('data-i18n');
  element.textContent = chrome.i18n.getMessage(message);
});
```

## Best Practices 最佳实践

1. **版本控制**
   - 使用语义化版本号
   - 保持更新日志
   - 定期更新依赖

2. **错误处理**
   - 实现全局错误处理
   - 提供用户友好的错误提示
   - 记录错误日志

3. **代码组织**
   - 模块化设计
   - 使用 ES6+ 特性
   - 保持代码简洁

4. **测试**
   - 单元测试
   - 集成测试
   - 用户测试

## Contributing 贡献

欢迎贡献更多最佳实践和经验！

## License 许可证

MIT License
