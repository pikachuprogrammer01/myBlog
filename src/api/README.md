# 前端 API 服务层

基于 Axios 的 HTTP 服务封装，包含统一的请求/响应拦截和按业务模块拆分的 Service 文件。

## 架构

```
views/ & stores/
     │
     ▼
services/          ← 各模块 API 函数（auth/article/comment/admin...）
     │
     ▼
client.js          ← Axios 实例（baseURL、拦截器、错误处理）
     │
     ▼
Backend API        ← https://myblog-api-five.vercel.app/api/*
```

## Axios 客户端 (`api/client.js`)

### 配置

- `baseURL` 从环境变量 `VITE_API_BASE` 读取
- 默认超时 15 秒
- 开发环境通过 Vite proxy 代理 `/api/*` 到 Vercel

### 请求拦截器

自动从 localStorage 读取 JWT Token 并附加到请求头：

```js
config.headers.Authorization = `Bearer ${token}`
```

### 响应拦截器

- 正常响应：直接返回 `response`
- 401 状态码：清除本地会话 → 跳转到 `/login`

## Service 模块

每个 Service 文件封装一个业务模块的全部 API 调用。

### authService.js

| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `login(username, password)` | POST | `/api/auth/login` | 用户登录 |
| `register(username, password)` | POST | `/api/auth/register` | 用户注册 |
| `getProfile()` | GET | `/api/auth/profile` | 获取当前用户信息 |
| `uploadAvatar(base64)` | POST | `/api/auth/avatar` | 上传头像 |
| `deleteAvatar()` | DELETE | `/api/auth/avatar` | 删除头像 |

### articleService.js

| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `getArticles(params)` | GET | `/api/articles` | 文章列表（分页、筛选） |
| `getArticle(slug)` | GET | `/api/articles/:slug` | 文章详情 |
| `getCategories()` | GET | `/api/categories` | 分类列表 |
| `getCategoryArticles(slug, params)` | GET | `/api/categories/:slug/articles` | 分类下文章 |
| `getStats()` | GET | `/api/stats` | 站点统计数据 |
| `toggleLike(slug)` | POST | `/api/articles/:slug/like` | 点赞/取消 |
| `getLikeStatus(slug)` | GET | `/api/articles/:slug/like` | 点赞状态 |
| `toggleBookmark(slug)` | POST | `/api/articles/:slug/bookmark` | 收藏/取消 |
| `getBookmarkStatus(slug)` | GET | `/api/articles/:slug/bookmark` | 收藏状态 |
| `getBookmarks()` | GET | `/api/user/bookmarks` | 收藏列表 |

### commentService.js

| 函数 | 方法 | 路径 | 说明 |
|------|------|------|------|
| `getComments(slug)` | GET | `/api/articles/:slug/comments` | 文章评论 |
| `addComment(slug, data)` | POST | `/api/articles/:slug/comments` | 添加评论 |
| `updateComment(id, content)` | PUT | `/api/comments/:id` | 编辑评论 |
| `deleteComment(id)` | DELETE | `/api/comments/:id` | 软删除评论 |
| `batchDeleteComments(ids)` | DELETE | `/api/comments/batch` | 批量软删除 |
| `permanentDeleteComment(id)` | DELETE | `/api/comments/:id/permanent` | 永久删除 |
| `toggleSticky(id)` | PUT | `/api/comments/:id/sticky` | 切换置顶 |
| `likeComment(id)` | POST | `/api/comments/:id/like` | 评论点赞 |

### adminService.js

管理后台全部 API，包含文章管理、用户管理、评论管理、标签管理、工具管理、系统操作、面试题库管理、项目管理。均为需要管理员权限的端点（`/api/admin/*`）。

### 其他 Service

| Service | 文件 | 用途 |
|---------|------|------|
| `contactService` | `contactService.js` | 联系表单提交与消息管理 |
| `interviewService` | `interviewService.js` | 面试题库公开 API |
| `projectService` | `projectService.js` | 项目展示公开 API |

## 新增 Service 指南

```js
// src/api/services/exampleService.js
import client from '@/api/client'

export function getExamples() {
  return client.get('/api/examples')
}

export function createExample(data) {
  return client.post('/api/examples', data)
}
```

Service 调用直接返回 Axios Response（`{ data: { success, data, message } }`），调用方负责解构和处理。
