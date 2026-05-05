# SPEC — myBlog 技术规格说明书

## 1. 项目概述

myBlog 是一个**全栈个人技术博客系统**，前端基于 Vue 3 + Element Plus，后端基于 Node.js/Express + MySQL，采用前后端分离架构，分别部署于 GitHub Pages 和 Vercel。

---

## 2. 技术栈

### 2.1 前端

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
| xlsx + file-saver + jszip | — | Excel 导出 |

### 2.2 后端

| 技术 | 用途 |
|------|------|
| Node.js + Express | API 服务 |
| mysql2 | MySQL 数据库驱动 |
| bcryptjs | 密码哈希 |
| jsonwebtoken | JWT 签发与验证 |
| nodemailer | 邮件发送（联系表单） |
| gray-matter | Markdown 前言解析 |
| cors | 跨域控制 |

### 2.3 基础设施

| 服务 | 用途 |
|------|------|
| GitHub Pages | 前端静态托管 |
| Vercel | API Serverless 部署 |
| TiDB Cloud | MySQL 兼容云数据库 |

### 2.4 开发工具

| 工具 | 用途 |
|------|------|
| Vitest + jsdom | 单元测试 |
| ESLint + Prettier | 代码规范与格式化 |
| gh-pages | 前端部署 |

---

## 3. 系统架构

### 3.1 部署拓扑

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  GitHub Pages   │────▶│  Vercel Server  │────▶│  TiDB Cloud  │
│  (/myBlog/)     │     │  (/api/*)       │     │  (MySQL)     │
│  静态前端 SPA    │     │  Node.js API    │     │  数据库       │
└─────────────────┘     └─────────────────┘     └──────────────┘
```

### 3.2 前端分层架构

```
src/
├── api/          # HTTP 服务层（axios 封装 + 各模块 service）
├── stores/       # Pinia 状态管理层（auth, article, comment）
├── composables/  # 组合式函数（useAuth, useArticles 等）
├── views/        # 页面组件（18 个路由页面）
├── components/   # 通用组件（layout, blog, admin, common, home）
├── router/       # 路由配置 + 导航守卫
├── utils/        # 工具函数（日期、缓存、存储、图片处理）
├── constants/    # 常量（localStorage key）
└── assets/       # 样式、图片
```

数据流向：`View → Composable → Store → Service → API → Backend → DB`

### 3.3 后端分层架构

```
api/
├── app.js        # Express 应用入口（CORS、路由挂载、错误处理）
├── db.js         # MySQL 连接池
├── middleware/    # JWT 鉴权中间件
├── routes/       # 公开路由（11 个模块）
│   └── admin/    # 管理员路由（7 个模块）
└── seed.js       # 数据库种子脚本
```

请求流程：`app.js → CORS → Body Parser → Route → Middleware(Auth) → DB → Response`

---

## 4. 数据库设计

### 4.1 ER 关系

```
users (用户)
  │
  ├──< comments (评论，一对多)
  ├──< comment_likes (评论点赞，一对多)
  ├──< article_likes (文章点赞，一对多)
  ├──< bookmarks (收藏，一对多)
  └──< contact_messages (联系消息，一对多)

articles (文章)
  │
  ├──< comments (评论，一对多)
  ├──< article_likes (点赞，一对多)
  ├──< bookmarks (收藏，一对多)
  └──< categories (分类，多对一)

categories (分类)
  └──< articles (文章，一对多)
```

### 4.2 数据表结构

#### users — 用户表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | bcrypt 哈希密码 |
| role | ENUM('admin','user') | DEFAULT 'user' | 角色 |
| avatar_url | VARCHAR(500) | NULL | 头像 URL（OSS） |
| created_at | TIMESTAMP | DEFAULT NOW() | 注册时间 |

#### categories — 分类表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 分类 ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 分类名 |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL 友好标识 |
| sort_order | INT | DEFAULT 0 | 排序 |

#### articles — 文章表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 文章 ID |
| title | VARCHAR(255) | NOT NULL | 标题 |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL 标识 |
| summary | TEXT | NULL | 摘要 |
| content | LONGTEXT | NOT NULL | Markdown 正文 |
| cover_url | VARCHAR(500) | NULL | 封面图 URL |
| category_id | INT | FK → categories.id | 分类 |
| tags | VARCHAR(500) | NULL | 标签（逗号分隔） |
| status | ENUM('published','draft') | DEFAULT 'published' | 发布状态 |
| view_count | INT | DEFAULT 0 | 阅读量 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE NOW() | 更新时间 |

#### comments — 评论表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 评论 ID |
| article_slug | VARCHAR(255) | NOT NULL | 所属文章 |
| user_id | INT | FK → users.id | 评论者 |
| parent_id | INT | FK → comments.id, NULL | 父评论（嵌套回复） |
| content | TEXT | NOT NULL | 评论内容 |
| is_sticky | BOOLEAN | DEFAULT FALSE | 置顶标记 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |
| like_count | INT | DEFAULT 0 | 点赞数 |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE NOW() | 更新时间 |

#### article_likes — 文章点赞表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| article_slug | VARCHAR(255) | NOT NULL | 文章标识 |
| user_id | INT | FK → users.id | 点赞用户 |
| created_at | TIMESTAMP | DEFAULT NOW() | 点赞时间 |
| **UNIQUE** | (article_slug, user_id) | — | 一人一票 |

#### comment_likes — 评论点赞表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| comment_id | INT | FK → comments.id | 评论 ID |
| user_id | INT | FK → users.id | 点赞用户 |
| created_at | TIMESTAMP | DEFAULT NOW() | 点赞时间 |
| **UNIQUE** | (comment_id, user_id) | — | 一人一票 |

#### bookmarks — 收藏表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| article_slug | VARCHAR(255) | NOT NULL | 文章标识 |
| user_id | INT | FK → users.id | 收藏用户 |
| created_at | TIMESTAMP | DEFAULT NOW() | 收藏时间 |
| **UNIQUE** | (article_slug, user_id) | — | 一人一次 |

#### contact_messages — 联系消息表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| user_id | INT | FK → users.id | 发送用户 |
| email | VARCHAR(255) | NOT NULL | 邮箱 |
| subject | VARCHAR(255) | NOT NULL | 主题 |
| message | TEXT | NOT NULL | 内容 |
| is_read | BOOLEAN | DEFAULT FALSE | 已读标记 |
| created_at | TIMESTAMP | DEFAULT NOW() | 发送时间 |

#### interview_categories — 面试题分类表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| name | VARCHAR(100) | NOT NULL | 分类名 |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL 标识 |
| icon | VARCHAR(100) | NULL | 图标 |
| sort_order | INT | DEFAULT 0 | 排序 |

#### interview_questions — 面试题表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| title | VARCHAR(255) | NOT NULL | 题目 |
| category_id | INT | FK → interview_categories.id | 分类 |
| difficulty | ENUM('easy','medium','hard') | NOT NULL | 难度 |
| tags | VARCHAR(500) | NULL | 标签 |
| summary | TEXT | NULL | 摘要 |
| content | LONGTEXT | NOT NULL | Markdown 内容 |
| created_at | TIMESTAMP | DEFAULT NOW() | — |
| updated_at | TIMESTAMP | ON UPDATE NOW() | — |

#### interview_comments — 面试题评论表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| question_id | INT | FK → interview_questions.id | 所属题目 |
| user_id | INT | FK → users.id | 评论者 |
| content | TEXT | NOT NULL | 评论内容 |
| parent_id | INT | FK → interview_comments.id | 父评论 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除 |
| created_at | TIMESTAMP | DEFAULT NOW() | — |

#### tools — 工具推荐表
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | — |
| name | VARCHAR(255) | NOT NULL | 工具名 |
| url | VARCHAR(500) | NOT NULL | 链接 |
| description | TEXT | NULL | 描述 |
| category | VARCHAR(100) | NOT NULL | 分类 |
| icon_url | VARCHAR(500) | NULL | 图标 |
| sort_order | INT | DEFAULT 0 | 排序 |

---

## 5. API 接口规范

### 5.1 通用约定

- **Base URL**: `https://myblog-api-five.vercel.app`
- **请求格式**: `Content-Type: application/json`
- **认证方式**: `Authorization: Bearer <JWT_TOKEN>`
- **响应格式**:
  ```json
  { "success": true, "data": {}, "message": "" }
  { "success": false, "message": "错误描述" }
  ```
- **分页格式**: Query 参数 `?page=1&pageSize=10`，响应含 `{ data: [], total, page, pageSize }`

### 5.2 公开接口（无需认证）

#### 认证模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（username, password） |
| POST | `/api/auth/login` | 登录（username, password），返回 JWT |
| GET | `/api/auth/profile` | 获取当前用户信息（需认证） |
| POST | `/api/auth/avatar` | 上传头像（需认证，multipart） |
| DELETE | `/api/auth/avatar` | 删除头像（需认证） |

#### 文章模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/articles` | 文章列表（?page=&pageSize=&category=&tag=&status=published） |
| GET | `/api/articles/:slug` | 文章详情（自动增加阅读量） |
| GET | `/api/categories` | 分类列表（含文章数量） |
| GET | `/api/categories/:slug/articles` | 按分类获取文章 |
| GET | `/api/tags` | 标签列表（含文章数量） |
| GET | `/api/stats` | 站点统计（文章/评论/用户/浏览量） |

#### 评论模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/articles/:slug/comments` | 文章评论列表（?sort=latest|oldest|hot） |
| POST | `/api/articles/:slug/comments` | 发表评论（需认证，content, parent_id） |
| PUT | `/api/comments/:id` | 编辑评论（需认证，仅本人/管理员） |
| DELETE | `/api/comments/:id` | 软删除评论（需认证，仅本人/管理员） |
| DELETE | `/api/comments/:id/permanent` | 永久删除（需管理员） |
| PUT | `/api/comments/:id/sticky` | 置顶/取消置顶（需管理员） |

#### 点赞与收藏
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/articles/:slug/like` | 文章点赞/取消（需认证） |
| GET | `/api/articles/:slug/like` | 文章点赞状态与总数 |
| POST | `/api/comments/:id/like` | 评论点赞/取消（需认证） |
| POST | `/api/articles/:slug/bookmark` | 收藏/取消（需认证） |
| GET | `/api/user/bookmarks` | 我的收藏列表（需认证） |

#### 联系表单
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/contact` | 提交联系信息（需认证，限 10 次/天） |
| GET | `/api/contact` | 消息列表（需管理员） |
| PUT | `/api/contact/:id/read` | 标记已读（需管理员） |

#### 工具推荐
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tools` | 工具列表（?category=） |

#### 面试题库
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/interview/categories` | 分类列表 |
| GET | `/api/interview/questions` | 题目列表（?category=, ?difficulty=） |
| GET | `/api/interview/questions/:id` | 题目详情 |
| GET | `/api/interview/questions/:id/comments` | 题目评论 |
| POST | `/api/interview/questions/:id/comments` | 发表评论（需认证） |

### 5.3 管理接口（需管理员认证）

#### 文章管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/articles` | 全部文章（含草稿） |
| POST | `/api/admin/articles` | 新建文章 |
| PUT | `/api/admin/articles/:id` | 编辑文章 |
| DELETE | `/api/admin/articles/:id` | 删除文章 |
| POST | `/api/admin/articles/upload` | Markdown 文件上传解析 |

#### 评论管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/comments` | 全部评论列表 |
| DELETE | `/api/admin/comments/:id` | 删除评论 |
| POST | `/api/admin/comments/batch-delete` | 批量删除 |
| DELETE | `/api/admin/comments/clear` | 清空所有评论 |

#### 标签管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/tags` | 标签列表 |
| POST | `/api/admin/tags` | 新建标签 |
| PUT | `/api/admin/tags/:id` | 编辑标签 |
| DELETE | `/api/admin/tags/:id` | 删除标签 |

#### 用户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表 |
| PUT | `/api/admin/users/:id` | 编辑用户（角色） |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| POST | `/api/admin/users/:id/reset-password` | 重置密码 |

#### 系统管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 管理后台统计数据 |
| POST | `/api/admin/reset` | 重置系统数据 |
| POST | `/api/admin/email-test` | 测试邮件配置 |

#### 工具管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/tools` | 工具列表 |
| POST | `/api/admin/tools` | 新建工具 |
| PUT | `/api/admin/tools/:id` | 编辑工具 |
| DELETE | `/api/admin/tools/:id` | 删除工具 |

#### 面试题管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/interview` | 题目列表 |
| POST | `/api/admin/interview` | 新建题目 |
| PUT | `/api/admin/interview/:id` | 编辑题目 |
| DELETE | `/api/admin/interview/:id` | 删除题目 |

#### 健康检查
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 服务健康检查（含数据库连接） |

---

## 6. 前端路由设计

| 路径 | 组件 | 认证 | 说明 |
|------|------|------|------|
| `/` | Home | 无 | 首页 |
| `/about` | About | 无 | 关于 |
| `/article/:id` | Article | 无 | 文章详情（id 为 slug） |
| `/tools` | Tools | 无 | 工具推荐 |
| `/contact` | Contact | 需登录 | 联系表单 |
| `/login` | Login | 访客 | 登录 |
| `/register` | Register | 访客 | 注册 |
| `/profile` | Profile | 需登录 | 个人中心 |
| `/bookmarks` | Bookmarks | 需登录 | 我的收藏 |
| `/tags` | Tags | 无 | 标签云 |
| `/categories` | Categories | 无 | 分类浏览 |
| `/search` | Search | 无 | 搜索 |
| `/archive` | Archive | 无 | 归档 |
| `/interview` | Interview | 无 | 面试题库首页 |
| `/interview/:category` | InterviewCategory | 无 | 题目列表 |
| `/interview/:category/:id` | InterviewQuestion | 无 | 题目详情 |
| `/admin` | Admin | 管理员 | 管理后台 |
| `/:pathMatch(.*)*` | NotFound | 无 | 404 |

**路由守卫**：
- `requiresAuth` → 验证 JWT，未登录跳转 `/login`
- `requiresAdmin` → 验证管理员角色，非管理员跳转首页

---

## 7. 组件树

### 7.1 布局层

```
App.vue
├── Header.vue（固定顶栏）
│   ├── Logo
│   ├── NavLinks（首页/归档/分类/标签/更多）
│   ├── SearchInput
│   └── AuthZone（登录/注册 或 用户下拉菜单）
├── Main.vue
│   ├── <router-view />（fade 过渡动画）
│   └── BackToTop.vue（回到顶部）
└── Footer.vue（页脚）
```

### 7.2 首页

```
Home.vue
├── Carousel.vue（精选文章轮播）
├── SectionHeader.vue（布局切换按钮）
├── ArticleList.vue
│   └── ArticleCard.vue × N（文章卡片）
└── Sidebar.vue（作者卡片 + 热门标签）
```

### 7.3 文章详情页

```
Article.vue
├── Breadcrumb
├── ArticleHeader（标题/日期/浏览量/分类/封面图）
├── MarkdownRenderer.vue
│   ├── ArticleContent（Markdown 渲染）
│   ├── TocNav（浮动目录）
│   └── ProgressBar（阅读进度条）
├── ArticleActions（点赞/收藏/分享/打印/导出/投诉）
├── PrevNextNav（上一篇/下一篇）
└── CommentSection
    ├── CommentForm.vue（评论输入 + Markdown 工具栏）
    └── CommentList.vue
        └── CommentItem × N（含嵌套回复）
```

### 7.4 管理后台

```
Admin.vue
├── AdminStats.vue（统计卡片）
├── AdminChart.vue（ECharts 饼图）
├── ArticleStatsTable.vue（文章数据表）
├── ArticleManager.vue（文章 CRUD）
├── CommentManager.vue（评论管理）
├── TagManager.vue（标签管理）
├── ToolManager.vue（工具管理）
├── InterviewManager.vue（面试题管理）
├── UserManager.vue（用户管理）
└── DataActions.vue（数据操作按钮）
```

---

## 8. 状态管理

### 8.1 Auth Store（`src/stores/auth.js`）

```js
state: { user, token, isAuthenticated, isAdmin }
actions: {
  login(username, password)      // → POST /api/auth/login, 存储 JWT
  register(username, password)   // → POST /api/auth/register, 自动登录
  restoreSession()               // → GET /api/auth/profile, 从 localStorage 恢复
  logout()                       // 清除 token 和 user
  updateAvatarUrl(url)           // 更新头像
  removeAvatarUrl()              // 删除头像
}
```

### 8.2 Article Store（`src/stores/article.js`）

```js
state: { articles, categories }
加载策略: localStorage 缓存 → 静态 JSON 文件 → API 刷新

methods: {
  loadArticles(options)          // 文章列表
  loadCategories()               // 分类列表
  searchArticles(query)          // 搜索
  getArticlesByTag(tag)          // 按标签筛选
  getArticlesByCategory(slug)    // 按分类筛选
  getPreviousNextArticles(slug)  // 上下篇导航
  toggleLike(slug)              // 点赞/取消
  toggleBookmark(slug)           // 收藏/取消
  getBookmarks()                 // 收藏列表
  invalidateCache()              // 清除缓存
}
```

### 8.3 Comment Store（`src/stores/comment.js`）

```js
state: { comments: { [articleSlug]: [...] } }
actions: {
  loadComments(articleSlug, sort)
  addComment(articleSlug, content, parentId)
  updateComment(commentId, content)
  deleteComment(commentId)
  batchDeleteComments(ids)
  permanentDeleteComment(commentId)
  toggleSticky(commentId)
  likeComment(commentId)
}
getters: {
  getCommentTree(articleSlug)    // 构建嵌套评论树
}
```

---

## 9. 认证与授权

### 9.1 JWT 流程

```
注册/登录 → 后端生成 JWT（含 userId, username, role, 7天过期）
         → 前端存入 localStorage
         → Axios 拦截器自动附加 Authorization: Bearer <token>
         → 后端中间件验证 token，注入 req.user
         → 管理员接口额外校验 role === 'admin'
```

### 9.2 权限矩阵

| 操作 | 游客 | 注册用户 | 管理员 |
|------|------|----------|--------|
| 阅读文章 | ✓ | ✓ | ✓ |
| 发表评论 | ✗ | ✓ | ✓ |
| 编辑评论 | ✗ | 仅自己 | ✓ |
| 删除评论 | ✗ | 仅自己（软删） | ✓（永久删） |
| 点赞/收藏 | ✗ | ✓ | ✓ |
| 访问管理后台 | ✗ | ✗ | ✓ |
| 管理内容 | ✗ | ✗ | ✓ |
| 提交联系表单 | ✗ | ✓（10次/天） | ✓ |

---

## 10. 安全措施

| 措施 | 实现 |
|------|------|
| 密码存储 | bcryptjs 加盐哈希（10 轮） |
| 传输安全 | JWT 令牌 + HTTPS + TiDB TLS 连接 |
| 跨域控制 | CORS 白名单（GitHub Pages + localhost） |
| 接口鉴权 | requireAuthMw / requireAdminMw 中间件 |
| 路由守卫 | Vue Router beforeEach 钩子检查 meta.requiresAuth/Admin |
| SQL 注入防护 | 参数化查询（mysql2 prepared statements） |
| 频率限制 | 联系表单 10 次/天/用户 |
| 敏感信息 | .env 文件 Git 忽略，JWT_SECRET 环境变量注入 |

---

## 11. 部署配置

### 11.1 前端部署（GitHub Pages）

```bash
npm run deploy
# 等价于: VITE_API_BASE=<API_URL> VITE_BASE=/myBlog/ vite build && gh-pages -d dist
```

- 构建输出目录：`dist/`
- 部署目标：GitHub Pages `https://pikachuprogrammer01.github.io/myBlog/`
- SPA 回退：`public/404.html` 将原始路径写入 `sessionStorage` 后重定向到首页

### 11.2 后端部署（Vercel）

- 构建配置：`vercel.json` → `api/index.js` = `require('./app')`
- 路由规则：`/api/(.*)` → API 函数，`/(.*)` → `dist/` 静态文件
- 环境变量：`JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SMTP_*`

---

## 12. 构建与开发

### 12.1 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（:5173） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run build:content` | Markdown 文章 → JSON 数据 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm run health-check` | 项目健康检查 |

### 12.2 环境变量

**前端**（`.env.development` / `.env.production`）：
- `VITE_API_BASE` — API 后端地址
- `VITE_BASE` — 前端基础路径（GitHub Pages 为 `/myBlog/`）

**后端**（`api/.env`，不提交 Git）：
- `JWT_SECRET` — JWT 签名密钥
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — 数据库连接
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — 邮件发送

### 12.3 Vite 构建优化

- Element Plus 自动按需导入（`unplugin-vue-components`）
- 手动代码分割：`vendor-echarts`, `vendor-xlsx`, `vendor`
- 路由懒加载（所有页面组件动态 import）

---

## 13. 测试策略

| 层级 | 工具 | 覆盖范围 |
|------|------|----------|
| 单元测试 | Vitest + jsdom | Pinia stores, 工具函数 |
| 组件测试 | @vue/test-utils | Carousel 等核心组件 |
| 健康检查 | check-health.js | 关键文件完整性 |

测试文件：
- `src/stores/__tests__/auth.test.js` — 登录/注册/登出流程
- `src/components/__tests__/Carousel.test.js` — 轮播组件行为
