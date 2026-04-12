# BlogPro - 个人笔记博客

一个简洁、优雅、功能丰富的个人笔记博客系统，支持深色模式、Markdown编辑和网站导航。

## ✨ 特性

- **📝 笔记系统**
  - Markdown 实时编辑/预览
  - 标签分类与筛选
  - 全文搜索
  - 置顶功能
  - 公开/私密状态

- **🔗 网站导航**
  - 分组管理
  - Favicon 自动获取
  - 快速添加网站
  - 搜索过滤

- **🌙 深色模式**
  - 支持浅色/深色/跟随系统
  - 流畅的过渡动画
  - 记住用户偏好

- **💫 精美动效**
  - Framer Motion 页面过渡
  - 悬停交互动效
  - 阅读进度条

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **状态管理**: Zustand
- **图标**: Lucide React
- **Markdown**: react-markdown + remark-gfm

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📁 项目结构

```
blogpro/
├── app/                    # Next.js App Router 页面
│   ├── notes/             # 笔记相关页面
│   │   ├── [slug]/        # 笔记详情页
│   │   └── page.tsx       # 笔记列表页
│   ├── write/page.tsx     # 写笔记页面
│   ├── sites/page.tsx     # 网站导航页
│   ├── settings/page.tsx # 设置页
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── layout/           # 布局组件
│   ├── note/             # 笔记相关组件
│   ├── site/             # 网站导航组件
│   └── ui/               # 通用 UI 组件
├── store/                 # Zustand 状态管理
│   ├── notesStore.ts     # 笔记状态
│   ├── sitesStore.ts     # 网站状态
│   └── settingsStore.ts  # 设置状态
└── app/globals.css       # 全局样式
```

## 📝 使用说明

1. **写笔记**: 点击导航栏"写笔记"或首页的"开始写作"按钮
2. **管理笔记**: 在笔记列表页可以筛选、搜索、置顶和删除笔记
3. **网站导航**: 在导航页管理常用的网站分组
4. **切换主题**: 点击导航栏的太阳/月亮图标切换主题
5. **导出数据**: 在设置页可以导出所有数据的 JSON 备份

## 🔒 数据存储

所有数据默认存储在浏览器的 localStorage 中，不会上传到任何服务器。请定期使用设置页的"导出数据"功能备份重要内容。

## 📄 License

MIT
