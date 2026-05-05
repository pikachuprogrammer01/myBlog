# myBlog — 全栈个人技术博客

基于 **Vue 3 + Element Plus** 前端与 **Node.js/Express + MySQL** 后端的全栈个人博客系统，支持文章发布、评论互动、收藏点赞、管理后台等功能。前端部署于 GitHub Pages，后端部署于 Vercel Serverless，数据库使用 TiDB Cloud MySQL。

## 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4.x | 前端框架（Composition API + `<script setup>`） |
| Vite | 5.x | 构建工具 |
| Vue Router | 4.x | 前端路由（Hash 模式） |
| Pinia | 2.x | 状态管理 |
| Element Plus | 2.7.x | UI 组件库 |
| Axios | 1.x | HTTP 客户端 |
| ECharts | 6.x | 管理后台图表 |
| Day.js | 1.x | 日期处理 |
| Markdown-it | 14.x | Markdown 渲染 |
| SCSS / Sass | 1.69.x | CSS 预处理 |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js + Express | API 服务框架 |
| mysql2 | MySQL 数据库驱动 |
| bcryptjs | 密码哈希 |
| jsonwebtoken | JWT 签发与验证 |
| nodemailer | 邮件发送 |

### 基础设施
| 服务 | 用途 |
|------|------|
| GitHub Pages | 前端静态托管 |
| Vercel | API Serverless 部署 |
| TiDB Cloud | MySQL 兼容云数据库 |

## 功能特性

- **文章系统**：Markdown 编写，代码高亮，分类与标签，阅读量统计
- **用户系统**：JWT 认证，注册/登录，个人资料，头像上传
- **评论系统**：嵌套评论，软删除，置顶，点赞
- **互动功能**：文章点赞、收藏
- **管理后台**：数据概览图表，文章/评论/用户/项目 CRUD 管理，Excel 数据导出
- **面试题库**：分类浏览，Markdown 题目展示
- **工具展示**：开发工具列表
- **项目展示**：个人项目卡片展示与链接跳转
- **暗黑工业风 UI**：深色主题，终端风格标题，网格点阵背景
- **响应式设计**：适配桌面端与移动端

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/pikachuprogrammer01/myBlog.git
cd myBlog

# 安装前端依赖
npm install

# 安装后端依赖
cd api && npm install && cd ..

# 启动开发服务器（端口 5173）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 后端配置

后端 API 部署在 Vercel，需要以下环境变量（在 Vercel Dashboard 中配置）：

| 变量 | 说明 |
|------|------|
| `DB_HOST` | TiDB Cloud 主机地址 |
| `DB_PORT` | 数据库端口 |
| `DB_USER` | 数据库用户名 |
| `DB_PASSWORD` | 数据库密码 |
| `DB_NAME` | 数据库名称 |
| `JWT_SECRET` | JWT 签名密钥 |
| `SMTP_HOST` | 邮件服务器地址 |
| `SMTP_PORT` | 邮件服务器端口 |
| `SMTP_USER` | 邮件账号 |
| `SMTP_PASS` | 邮件密码 |

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 本地预览生产构建 |
| `npm run build:content` | 从 Markdown 构建文章 JSON |
| `npm run build:sql` | 从文章生成 SQL 种子文件 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 代码格式化 |
| `npm run test` | 运行 Vitest 测试套件 |
| `npm run deploy` | 构建并部署到 GitHub Pages |
| `npm run health-check` | 项目健康检查 |

## 项目结构

```
myBlog/
├── api/                    # 后端 API（Express + Vercel Serverless）
│   ├── app.js              # Express 应用配置与路由挂载
│   ├── db.js               # MySQL 连接池（TiDB Cloud, TLS）
│   ├── index.js            # Vercel Serverless 入口
│   ├── seed.js             # 数据库种子脚本
│   ├── middleware/          # JWT 认证中间件
│   ├── routes/              # API 路由模块
│   │   ├── admin/           # 管理后台路由（articles/comments/users/tags/tools/system/interview/projects）
│   │   └── *.js             # 公开路由（articles/auth/categories/comments/contact/interview/likes/projects/stats/tags/tools）
│   ├── utils/               # 邮件发送、OSS 上传工具
│   └── .env                 # 环境变量（数据库凭据，不可提交）
├── content/                # Markdown 文章源文件（21 篇）与配图
├── public/                 # 静态资源（favicon、头像、轮播图）
├── scripts/                # 构建脚本（内容编译、SQL 生成、健康检查）
├── src/                    # 前端源码
│   ├── api/                # HTTP 服务层（axios 封装 + 各模块 service）
│   ├── assets/styles/      # 全局 SCSS 样式
│   ├── components/         # 通用 Vue 组件
│   │   ├── admin/           # 管理后台组件（图表/统计/CRUD 面板）
│   │   ├── blog/            # 博客组件（文章卡片/评论/Markdown 渲染）
│   │   ├── common/          # 通用组件（回到顶部）
│   │   ├── home/            # 首页组件（轮播/侧边栏/布局切换）
│   │   └── layout/          # 布局组件（页头/页脚/主框架）
│   ├── composables/        # 组合式函数（useAuth/useArticles/useComments/useHomeArticles/useNavigationLoading）
│   ├── constants/          # 常量（localStorage key、导出配置）
│   ├── data/               # 静态文章数据（build:content 编译产物）
│   ├── router/             # Vue Router 配置 + 导航守卫
│   ├── stores/             # Pinia 状态管理（auth/article/comment）
│   ├── utils/              # 工具函数（缓存/日期/存储/确认框/错误处理）
│   └── views/              # 页面组件（19 个路由页面）
├── tests/                  # Vitest 测试配置
├── vite.config.js          # Vite 构建配置
├── vitest.config.js        # Vitest 测试配置
├── vercel.json             # Vercel 部署配置
└── package.json            # 前端依赖与脚本
```

## 部署拓扑

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  GitHub Pages   │────▶│  Vercel Server  │────▶│  TiDB Cloud  │
│  (/myBlog/)     │     │  (/api/*)       │     │  (MySQL)     │
│  静态前端 SPA    │     │  Node.js API    │     │  数据库       │
└─────────────────┘     └─────────────────┘     └──────────────┘
```

## 前端路由

| 路径 | 页面 | 认证要求 |
|------|------|----------|
| `/` | 首页 | 无 |
| `/about` | 关于 | 无 |
| `/article/:id` | 文章详情 | 无 |
| `/tools` | 工具列表 | 无 |
| `/projects` | 项目展示 | 无 |
| `/contact` | 联系表单 | 无 |
| `/login` | 登录 | 无 |
| `/register` | 注册 | 无 |
| `/profile` | 个人中心 | 需登录 |
| `/bookmarks` | 我的收藏 | 需登录 |
| `/tags` | 标签列表 | 无 |
| `/categories` | 分类列表 | 无 |
| `/search` | 搜索 | 无 |
| `/archive` | 文章归档 | 无 |
| `/interview` | 面试题库 | 无 |
| `/interview/:category` | 题目分类 | 无 |
| `/interview/:category/:id` | 题目详情 | 无 |
| `/admin` | 管理后台 | 需管理员 |
| `/*` | 404 | 无 |

## API 端点

详见 [api/README.md](api/README.md)

## 模块文档

- [前端架构](src/README.md) — 分层架构、数据流、路由设计
- [组件库](src/components/README.md) — 组件分类与功能说明
- [状态管理](src/stores/README.md) — Pinia Store 设计
- [组合式函数](src/composables/README.md) — Composable API 说明
- [API 服务层](src/api/README.md) — 前端 HTTP 服务封装
- [工具函数](src/utils/README.md) — 通用工具函数
- [后端 API](api/README.md) — 路由、中间件、数据库
- [内容管理](content/README.md) — Markdown 文章编写与构建
- [构建脚本](scripts/README.md) — 编译、迁移、健康检查

## License

MIT
