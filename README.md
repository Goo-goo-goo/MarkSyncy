# MarkSyncy - 网页收藏器

一个功能强大的Edge浏览器扩展，帮助您轻松收藏和管理网页。

## ✨ 功能特性

- 🖱️ **右键菜单收藏** - 在任何网页上右键即可快速收藏
- 📚 **收藏组管理** - 创建、编辑、删除收藏组，更好地组织内容
- 🔍 **智能搜索** - 快速找到您收藏的内容
- 🎨 **现代UI设计** - 基于React和Tailwind CSS的美观界面
- 💾 **本地存储** - 数据安全存储在本地，保护您的隐私
- 🚀 **轻量快速** - 优化的性能，不影响浏览体验

## 🛠️ 技术栈

- **前端框架**: React 18
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **UI组件**: Radix UI
- **图标库**: Lucide React
- **浏览器API**: Chrome Extensions API

## 📦 安装说明

### 开发环境设置

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd MarkSyncy
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式**
   ```bash
   npm run dev
   ```

4. **构建扩展**
   ```bash
   npm run build:extension
   ```

### 在Edge中安装

1. 运行 `npm run build:extension` 构建项目
2. 打开Edge浏览器，进入扩展管理页面 (`edge://extensions/`)
3. 开启"开发人员模式"
4. 点击"加载解压缩的扩展"
5. 选择项目根目录下的 `dist` 文件夹

## 🚀 使用方法

### 收藏网页
1. 在任何网页上右键点击
2. 选择"收藏此网页"
3. 页面右上角会显示收藏成功提示

### 管理收藏
1. 点击浏览器工具栏中的扩展图标
2. 在弹窗中查看所有收藏组
3. 创建新的收藏组来组织内容
4. 编辑或删除现有的收藏组

### 查看收藏状态
- 已收藏的网页会在右上角显示📚图标
- 点击图标可以查看收藏详情或取消收藏

## 🏗️ 项目结构

```
MarkSyncy/
├── src/
│   ├── components/          # React组件
│   │   ├── ui/             # 基础UI组件
│   │   └── ...             # 业务组件
│   ├── lib/                 # 工具函数
│   ├── App.jsx             # 主应用组件
│   ├── main.jsx            # 应用入口
│   └── index.css           # 全局样式
├── background.js            # 后台脚本
├── content.js              # 内容脚本
├── popup.html              # 弹窗页面
├── manifest.json           # 扩展清单
└── package.json            # 项目配置
```

## 🔧 开发指南

### 添加新功能
1. 在 `src/components/` 中创建新组件
2. 在 `src/App.jsx` 中集成组件
3. 更新 `manifest.json` 如果需要新的权限

### 样式修改
- 使用Tailwind CSS类名进行样式调整
- 在 `src/index.css` 中添加自定义样式

### 权限管理
在 `manifest.json` 中管理扩展权限：
- `contextMenus`: 右键菜单
- `storage`: 本地存储
- `activeTab`: 当前标签页访问

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 基础收藏功能
- 收藏组管理
- 现代UI界面

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🆘 支持

如果您遇到问题或有建议，请：
1. 查看 [Issues](../../issues) 页面
2. 创建新的Issue描述问题
3. 联系开发团队

---

**MarkSyncy** - 让网页收藏变得简单高效 🚀
