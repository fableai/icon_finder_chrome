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
- [代码混淆指南](#代码混淆指南)
- [Version Control 版本控制](#version-control-版本控制)

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
  ],
  "host_permissions": [
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "128": "images/icon128.png"
    }
  },
  "content_security_policy": {
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
## Internationalization 国际化

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

## 代码混淆指南

在对 Chrome 扩展进行代码混淆时，需要特别注意以下几点：

### 常见问题

在使用代码混淆工具（如 terser）时，可能会遇到 `Uncaught TypeError: Cannot read properties of undefined` 错误。这通常是因为混淆工具默认会混淆所有变量名和属性名，包括 Chrome API 的调用。

### 解决方案

使用 terser 的 `reserved` 选项来保留 Chrome API 相关的属性名：

```json
{
  "scripts": {
    "build": "npx terser input.js -c -m reserved=['chrome'] -o output.js"
  }
}
```

### 注意事项

1. Chrome API 相关：
   - 必须保留 `chrome` 对象及其属性
   - 常用的 API 包括：`chrome.runtime`、`chrome.tabs`、`chrome.storage` 等
   - 避免混淆 Chrome API 的回调函数名

2. 代码混淆配置：
   - `-c`: 启用代码压缩
   - `-m`: 启用代码混淆
   - `reserved`: 指定不需要混淆的变量名
   - 可以添加多个保留字：`reserved=['chrome','window','document']`

3. 构建流程：
   - 先清理旧的构建文件
   - 复制静态资源（images、html、manifest.json）
   - 对 JS 文件进行混淆处理
   - 保持文件结构完整

4. 测试验证：
   - 每次修改混淆配置后都需要完整测试
   - 特别注意 Chrome API 的调用是否正常
   - 检查消息传递、事件监听等功能

5. 调试建议：
   - 保留开发环境的未混淆版本
   - 使用 Chrome 开发者工具检查错误
   - 必要时可以添加 sourcemap 便于调试

6. 安全性：
   - 混淆可以提高代码的安全性
   - 但不要在代码中包含敏感信息
   - 关键的业务逻辑最好放在后端

### 示例构建脚本

完整的构建脚本示例：

```json
{
  "scripts": {
    "build": "rm -rf build && mkdir build && cp manifest.json build/ && cp -r images build/ && cp popup.html build/ && npx terser popup.js -c -m reserved=['chrome'] -o build/popup.js && npx terser background.js -c -m reserved=['chrome'] -o build/background.js"
  }
}
```

这个构建脚本会：
1. 清理并创建 build 目录
2. 复制必要的静态文件
3. 使用 terser 混淆 JS 文件，同时保留 Chrome API 相关的属性名

## Version Control 版本控制

### Git 配置

在使用 Git 进行版本控制时，建议创建 `.gitignore` 文件来排除不需要提交的文件：

```bash
# Dependencies
node_modules/           # npm 依赖目录

# Build output
build/                 # 构建输出目录
dist/                  # 分发目录
*.zip                 # 打包文件

# Development files
.env                  # 环境变量
.env.local
.env.*.local

# Editor directories and files
.idea/                # JetBrains IDE
.vscode/             # Visual Studio Code
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS generated files
.DS_Store            # macOS
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db          # Windows
Thumbs.db

# npm
package-lock.json    # npm 包锁定文件
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

这个配置可以帮助你：
1. 排除依赖和构建文件
2. 避免提交敏感信息
3. 忽略操作系统和编辑器生成的文件
4. 保持仓库整洁

建议在项目初始化时就配置好 `.gitignore`，这样可以避免不必要的文件被提交到版本控制系统中。
## Contributing 贡献

欢迎贡献更多最佳实践和经验！

## License 许可证

MIT License
