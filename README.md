# 🎬 Cloud Player (云影聚合助手)

![Version](https://img.shields.io/badge/version-3.0.0-blue) ![Vue](https://img.shields.io/badge/Vue.js-3.x-green) ![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-orange) ![License](https://img.shields.io/badge/license-MIT-grey)

一个基于 **Chrome Extension Manifest V3** 开发的沉浸式无后台视频聚合播放器。
它利用浏览器扩展的权限特性，直接请求 MacCMS 标准接口，实现无广告、极速、全屏的观影体验。

> **特点**：无后台服务器、纯前端实现、本地化运行、绕过跨域限制、Netflix 风格 UI。

---

## ✨ 功能特性 (Features)

*   🚀 **极速播放**：基于 ArtPlayer + Hls.js，支持 m3u8 流媒体自动切片播放。
*   🎨 **沉浸式 UI**：基于 Tailwind CSS 设计的深色模式界面，自适应响应式布局。
*   🔌 **多源切换**：支持配置多个 MacCMS 资源站接口，一键切换线路。
*   ⏭️ **自动连播**：当前集数播放完毕后，自动跳转下一集。
*   ⏩ **跳过片头/片尾**：可自定义跳过的时间（秒），无缝衔接正片。
*   🔊 **音量记忆**：自动记录上次播放的音量设置，刷新页面不丢失。
*   ⚡ **倍速播放**：支持 0.5x - 2.0x 播放速度调节。
*   🔍 **全网搜索**：聚合搜索功能，支持分类筛选。

---

## 🛠️ 技术架构 (Architecture)

本项目为了在 **Chrome Extension Manifest V3** 的严格安全策略（CSP）下运行 Vue 3 和 Hls.js，采用了 **"Iframe Bridge" (Iframe 桥接)** 架构模式：

1.  **Parent (index.html)**: 普通扩展页面。拥有最高权限，负责发起跨域网络请求 (Axios) 和持久化存储 (LocalStorage)。
2.  **Sandbox (ui.html)**: 沙盒环境页面。允许执行 `unsafe-eval` (Vue 模板编译所需)，负责 UI 渲染和逻辑控制。
3.  **Bridge (Message Passing)**: 两者通过 `window.postMessage` 进行通信。UI 层发送请求指令，父层执行并返回数据。

---

## 📦 安装说明 (Installation)

由于本项目是浏览器扩展，尚未发布到 Chrome 商店，需通过开发者模式安装。

1.  **下载/克隆本项目** 到本地：
    ```bash
    git clone https://github.com/timeManage/cloud-player.git
    ```
2.  打开 Chrome 浏览器，在地址栏输入：`chrome://extensions/`
3.  打开右上角的 **"开发者模式" (Developer mode)** 开关。
4.  点击左上角的 **"加载已解压的扩展程序" (Load unpacked)**。
5.  选择本项目的根目录文件夹。
6.  安装成功！点击浏览器右上角的插件图标即可开始观影。

---

## ⚙️ 配置教程 (Configuration)

### 添加/修改视频源
你可以添加任何支持 MacCMS (json) 格式的接口。

1.  打开文件 `js/ui-logic.js`。
2.  找到 `setup()` 函数中的 `apiList` 变量。
3.  按照以下格式添加新的对象：

```javascript
const apiList = ref([
    { name: '极速资源', host: 'https://ikunzyapi.com' },
    { name: '量子资源', host: 'https://cj.lziapi.com' },
    // 👇 添加你的新资源站
    { name: '天空资源', host: 'https://api.tiankongapi.com' } 
]);
```

> **注意**：接口必须支持 HTTPS，且无需在 `host` 后添加 `/api.php...` 后缀。

---

## 📂 项目结构 (File Structure)

```text
cloud-player/
├── manifest.json        # 核心配置文件 (MV3, Sandbox, Permission)
├── background.js        # 后台服务 (负责打开新标签页)
├── index.html           # 父级容器 (处理 Axios 跨域 & LocalStorage)
├── ui.html              # UI 界面 (运行 Vue & 播放器)
├── css/
│   └── tailwind.css     # 本地化的 Tailwind 样式库
└── js/
    ├── bridge.js        # 父页面桥接逻辑
    ├── ui-logic.js      # 核心业务逻辑 (Vue App)
    ├── vue.js           # Vue 3 核心库
    ├── axios.js         # 网络请求库
    ├── artplayer.js     # 播放器核心
    └── hls.js           # 流媒体解码库
```

---

## ⚠️ 免责声明 (Disclaimer)

*   本项目仅供 **技术学习和交流** 使用，旨在研究 Chrome Extension MV3 架构与 Vue 3 的结合应用。
*   本项目 **不提供、不存储、不索引** 任何视频内容。所有数据均来源于互联网上的第三方公共接口。
*   使用者需自行承担使用本工具产生的所有责任。请支持正版影视，遵守当地法律法规。

---

## 📄 开源协议 (License)

[MIT License](LICENSE) © 2023 YourName

---

**如果觉得这个项目对你有帮助，请给一个 ⭐ Star！**
