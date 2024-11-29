# Icon Finder Chrome Extension
# 图标查找器 Chrome 扩展

A Chrome extension that helps you easily find and extract icons from any website.

一个帮助你轻松从任何网站查找和提取图标的 Chrome 扩展。

## Features 功能

- 🔍 Find all icons on the current webpage
  查找当前网页上的所有图标
- 🖼️ Extract favicons and other icon assets
  提取网站图标和其他图标资源
- 💾 One-click download of icons
  一键下载图标
- 🎨 Support for various icon formats (PNG, ICO, SVG)
  支持多种图标格式（PNG、ICO、SVG）

## Installation 安装

1. Clone this repository
   克隆此仓库
   ```bash
   git clone [your-repository-url]
   ```

2. Open Chrome and navigate to `chrome://extensions/`
   打开 Chrome 浏览器，访问 `chrome://extensions/`

3. Enable "Developer mode" in the top right corner
   在右上角启用"开发者模式"

4. Click "Load unpacked" and select the extension directory
   点击"加载已解压的扩展程序"并选择扩展目录

## Usage 使用方法

1. Click the extension icon in your Chrome toolbar
   点击 Chrome 工具栏中的扩展图标

2. The popup will show all available icons on the current webpage
   弹出窗口将显示当前网页上所有可用的图标

3. Click on any icon to download it
   点击任何图标即可下载

## Development 开发

### Project Structure 项目结构

```
icon_finder_chrome/
├── manifest.json      # Extension manifest file
├── popup.html        # Popup interface
├── popup.js          # Popup logic
├── build/           # Built files
└── images/          # Extension icons and assets
```

### Build 构建

Run the build script:
运行构建脚本：

```bash
./build.sh
```

## Contributing 贡献

Contributions are welcome! Please feel free to submit a Pull Request.
欢迎贡献！请随时提交 Pull Request。

## License 许可证

[MIT License](LICENSE)

## Contact 联系方式

If you have any questions or suggestions, please open an issue.
如果您有任何问题或建议，请开启一个 issue。
