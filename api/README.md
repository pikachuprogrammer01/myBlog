# 后端 API

基于 **Node.js + Express** 的 Serverless API，部署于 **Vercel**，数据库使用 **TiDB Cloud MySQL**。

## 架构

```
Vercel Serverless Function
  │
  ▼
api/index.js        ← 入口：导入 Express 应用并导出
  │
  ▼
api/app.js          ← Express 应用：CORS、中间件、路由挂载、错误处理
  │
  ├─ middleware/     ← JWT 认证中间件
  ├─ routes/         ← 公开 API 路由（11 个模块）
  │   └─ admin/      ← 管理员 API 路由（8 个模块）
  ├─ utils/          ← 邮件、OSS 工具
  └─ db.js           ← MySQL 连接池
```

## 技术栈

| 技术 | 用途 |
|------|------|
| Express 4.x | Web 框架 |
| mysql2 | MySQL 数据库驱动（TLS 加密连接） |
| bcryptjs | 密码哈希（10 轮加密） |
| jsonwebtoken | JWT 签发与验证（7 天有效期） |
| nodemailer | 邮件发送（联系表单通知） |
| cors | 跨域请求控制 |
| gray-matter | Markdown 前言解析 |

## 数据库

### 连接配置

- MySQL 连接池（`api/db.js`）
- 最小连接数: 1，最大连接数: 10
- TLS/SSL 加密连接到 TiDB Cloud
- 环境变量: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### 数据表（8 张）

| 表名 | 说明 |
|------|------|
| `users` | 用户表（id, username, password_hash, email, role, avatar_url, created_at） |
| `categories` | 分类表（id, name, slug, description, created_at） |
| `articles` | 文章表（id, title, slug, content, summary, cover_image, category_id, tags, status, view_count, created_at, updated_at） |
| `comments` | 评论表（id, article_id, parent_id, user_id, content, is_sticky, is_deleted, created_at, updated_at） |
| `comment_likes` | 评论点赞表（id, comment_id, user_id, created_at） |
| `article_likes` | 文章点赞表（id, article_id, user_id, created_at） |
| `bookmarks` | 收藏表（id, article_id, user_id, created_at） |
| `contact_messages` | 联系消息表（id, name, email, subject, message, is_read, created_at） |

## API 端点

### 认证模块 (`/api/auth`)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 无 | 用户注册 |
| POST | `/api/auth/login` | 无 | 用户登录，返回 JWT |
| GET | `/api/auth/profile` | JWT | 获取当前用户信息 |
| POST | `/api/auth/avatar` | JWT | 上传头像（Base64） |
| DELETE | `/api/auth/avatar` | JWT | 删除头像 |

### 文章模块 (`/api/articles`)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/articles` | 无 | 文章列表（支持分页、分类筛选） |
| GET | `/api/articles/:slug` | 无 | 文章详情（自动计数浏览量） |
| GET | `/api/articles/:slug/comments` | 无 | 文章评论列表 |
| POST | `/api/articles/:slug/comments` | JWT | 添加评论 |
| POST | `/api/articles/:slug/like` | JWT | 切换文章点赞 |
| GET | `/api/articles/:slug/like` | 无 | 获取点赞状态 |
| POST | `/api/articles/:slug/bookmark` | JWT | 切换收藏 |
| GET | `/api/articles/:slug/bookmark` | 无 | 获取收藏状态 |

### 评论模块 (`/api/comments`)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| PUT | `/api/comments/:id` | JWT | 编辑评论（作者或管理员） |
| DELETE | `/api/comments/:id` | JWT | 软删除评论（作者或管理员） |
| DELETE | `/api/comments/batch` | Admin | 批量软删除 |
| DELETE | `/api/comments/:id/permanent` | Admin | 永久删除评论 |
| PUT | `/api/comments/:id/sticky` | Admin | 切换置顶状态 |
| POST | `/api/comments/:id/like` | JWT | 切换评论点赞 |

### 其他公开端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 分类列表（含文章计数） |
| GET | `/api/categories/:slug/articles` | 分类下文章列表 |
| GET | `/api/stats` | 站点统计数据 |
| GET | `/api/tags` | 标签列表 |
| GET | `/api/tools` | 工具列表 |
| GET | `/api/interview` | 面试题库列表 |
| GET | `/api/interview/:category` | 题库分类详情 |
| GET | `/api/interview/:category/:id` | 单题详情 |
| GET | `/api/projects` | 项目列表 |
| POST | `/api/contact` | 提交联系表单 |
| GET | `/api/contact` | 联系消息列表（Admin） |
| PUT | `/api/contact/:id/read` | 标记消息已读（Admin） |
| GET | `/api/user/bookmarks` | 用户收藏列表（JWT） |
| GET | `/api/health` | 健康检查 |

### 管理后台 (`/api/admin/*`)

所有 Admin 端点均需要 `requireAdmin` 中间件。

| 模块 | 路径前缀 | 功能 |
|------|----------|------|
| 文章管理 | `/api/admin/articles` | CRUD + 上传 |
| 用户管理 | `/api/admin/users` | 用户列表、角色修改 |
| 评论管理 | `/api/admin/comments` | 评论管理 |
| 标签管理 | `/api/admin/tags` | 标签 CRUD |
| 工具管理 | `/api/admin/tools` | 工具 CRUD |
| 系统操作 | `/api/admin` | 清空评论、重置数据、邮件测试 |
| 题库管理 | `/api/admin/interview` | 面试题 CRUD |
| 项目管理 | `/api/admin/projects` | 项目 CRUD |

## 中间件 (`middleware/auth.js`)

```js
const { sign, verify } = require('jsonwebtoken')

// JWT 签发
function createToken(user) → String  // 7 天有效期

// 认证中间件
function requireAuth(req, res, next)  // 验证 Bearer Token，注入 req.user

// 管理员中间件
function requireAdmin(req, res, next)  // requireAuth + 校验 role === 'admin'
```

## CORS 白名单

```js
const ALLOWED_ORIGINS = [
  'https://pikachuprogrammer01.github.io',  // 生产环境
  'https://myblog-api-five.vercel.app',      // API 自身
  'http://localhost:5173',                   // Vite 开发服务器
  'http://localhost:5174',
  'http://localhost:3000',
]
```

## 本地运行

```bash
cd api
npm install

# 配置 .env 文件（数据库凭据等）

# 初始化数据库表
node -e "require('./db'); const fs=require('fs'); const pool=require('./db');
pool.execute(fs.readFileSync('schema.sql','utf8'))"

# 导入种子数据
node seed.js

# 启动 Express 服务（端口 3000）
npx vercel dev
```

## 响应格式

所有 API 返回统一 JSON 格式：

```json
// 成功
{ "success": true, "data": { ... }, "message": "可选消息" }

// 失败
{ "success": false, "message": "错误描述" }
```

## 安全性

- 密码使用 bcryptjs 哈希（10 轮加密），不存储明文
- JWT Token 7 天过期，存储在 localStorage
- CORS 白名单限制允许的来源
- 数据库连接使用 TLS 加密
- 评论操作校验作者身份（owner 或 admin）
- 管理端点双重校验（JWT + admin role）
- `.env` 文件包含真实凭据，已加入 `.gitignore`
