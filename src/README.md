# 前端架构

基于 **Vue 3 Composition API** 的单页应用，采用分层架构设计，通过 **Pinia** 管理全局状态，**Vue Router** 控制路由，**Axios** 负责 API 通信。

## 分层架构

```
views/          ← 页面组件（路由级组件，组合业务逻辑）
  │
composables/    ← 组合式函数（封装 Store 调用，提供简洁 API）
  │
stores/         ← Pinia 状态管理（全局共享状态，API 调用）
  │
api/            ← HTTP 服务层（axios 实例 + 各模块 Service）
  │
utils/          ← 工具函数（缓存、日期、存储、确认框等）
constants/      ← 常量（localStorage key、导出配置）
```

### 数据流

```
User Action → View → Composable → Pinia Store → API Service → Axios → Backend API
                                                                          │
LocalStorage (cache)  ←──────────────────────────────────────────────────┘
```

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4.x | Composition API + `<script setup>` |
| Vue Router | 4.x | Hash 模式路由 |
| Pinia | 2.x | 全局状态管理 |
| Element Plus | 2.7.x | UI 组件库 |
| Axios | 1.x | HTTP 客户端 |
| ECharts | 6.x | 管理后台图表 |
| SCSS | 1.69.x | CSS 预处理 |

## 目录结构

```
src/
├── api/                    # HTTP 服务层
│   ├── client.js           # axios 实例（baseURL、JWT 拦截器、401 处理）
│   └── services/           # 各模块 Service（auth/article/comment/admin/contact/interview/project）
├── assets/styles/          # 全局 SCSS（main.scss）
├── components/             # 通用组件（详见 components/README.md）
│   ├── admin/              # 管理后台面板组件（11 个）
│   ├── blog/               # 博客功能组件（5 个）
│   ├── common/             # 通用组件（1 个）
│   ├── home/               # 首页组件（3 个）
│   └── layout/             # 布局组件（3 个）
├── composables/            # 组合式函数（5 个）
├── constants/              # 常量定义（3 个）
├── data/                   # 构建时生成的静态文章数据
├── router/                 # 路由配置与导航守卫
├── stores/                 # Pinia 状态管理
├── utils/                  # 工具函数（8 个）
└── views/                  # 页面组件（19 个路由页面）
```

## 路由设计

共 **18 个路由** + 1 个通配 404，采用 Hash 模式（兼容 GitHub Pages）：

| 路径 | 页面 | 权限 |
|------|------|------|
| `/` | Home | 公开 |
| `/about` | About | 公开 |
| `/article/:id` | Article | 公开 |
| `/tools` | Tools | 公开 |
| `/projects` | Projects | 公开 |
| `/contact` | Contact | 公开 |
| `/login` | Login | 公开 |
| `/register` | Register | 公开 |
| `/profile` | Profile | 需登录 |
| `/bookmarks` | Bookmarks | 需登录 |
| `/tags` | Tags | 公开 |
| `/categories` | Categories | 公开 |
| `/search` | Search | 公开 |
| `/archive` | Archive | 公开 |
| `/interview` | Interview | 公开 |
| `/interview/:category` | InterviewCategory | 公开 |
| `/interview/:category/:id` | InterviewQuestion | 公开 |
| `/admin` | Admin | 需管理员 |

### 导航守卫

```js
router.beforeEach(async (to, from) => {
  // 需要认证的路由：先恢复 session，再校验
  if (to.meta.requiresAuth || to.meta.requiresAdmin) {
    if (token && !user) await restoreSession()  // 页面刷新后恢复登录态
    if (!isAuthenticated) return '/login'        // 未登录跳转登录页
    if (requiresAdmin && !isAdmin) return '/'    // 非管理员跳转首页
  }
})
```

## 状态管理

三个 Pinia Store 覆盖核心业务状态：

| Store | 文件 | 职责 |
|-------|------|------|
| `useAuthStore` | `stores/auth.js` | 用户认证、JWT Token 管理、登录/注册/登出 |
| `useArticleStore` | `stores/article.js` | 文章列表、分类、搜索、点赞、收藏 |
| `useCommentStore` | `stores/comment.js` | 评论 CRUD、嵌套树、置顶、点赞 |

所有 Store 均采用 Setup Store 语法（`defineStore` + Composition API）。

## API 通信

### Axios 实例（`api/client.js`）

- `baseURL` 从环境变量 `VITE_API_BASE` 读取
- 请求拦截器：自动附加 `Authorization: Bearer <token>`
- 响应拦截器：401 时清除本地会话并跳转到登录页
- 开发环境通过 Vite proxy 代理到 Vercel API

### Service 层

每个业务模块一个 Service 文件，封装相关 API 调用：

| Service | 文件 | 功能 |
|---------|------|------|
| `authService` | `api/services/authService.js` | 登录、注册、获取资料、头像上传/删除 |
| `articleService` | `api/services/articleService.js` | 文章列表、详情、分类、点赞、收藏 |
| `commentService` | `api/services/commentService.js` | 评论增删改、批量删除、永久删除、置顶 |
| `adminService` | `api/services/adminService.js` | 管理后台全部 CRUD 操作 |
| `contactService` | `api/services/contactService.js` | 联系表单提交 |
| `interviewService` | `api/services/interviewService.js` | 面试题库 API |
| `projectService` | `api/services/projectService.js` | 项目展示 API |

### 数据加载策略

采用 **Cache-First + Stale-While-Revalidate** 模式：

1. 优先读取 localStorage 缓存 → 立即渲染
2. 缓存不存在时使用静态 JSON 兜底
3. 后台发起 API 请求刷新数据
4. 成功后更新缓存和界面

## 代码规范

- Vue SFC 使用 `<script setup>` + Composition API
- 样式使用 SCSS，限定在 `<style scoped lang="scss">` 内
- CSS 类名使用 `.blog-` 前缀 + BEM 命名
- 不写无意义的注释，代码即文档

## 页面列表（19 个）

| 页面 | 文件路径 |
|------|----------|
| Home | `views/Home.vue` |
| About | `views/About.vue` |
| Article | `views/Article.vue` |
| Tools | `views/Tools.vue` |
| Projects | `views/Projects.vue` |
| Contact | `views/Contact.vue` |
| Login | `views/Login.vue` |
| Register | `views/Register.vue` |
| Profile | `views/Profile.vue` |
| Bookmarks | `views/Bookmarks.vue` |
| Tags | `views/Tags.vue` |
| Categories | `views/Categories.vue` |
| Search | `views/Search.vue` |
| Archive | `views/Archive.vue` |
| Interview | `views/Interview.vue` |
| InterviewCategory | `views/InterviewCategory.vue` |
| InterviewQuestion | `views/InterviewQuestion.vue` |
| Admin | `views/Admin.vue` |
| NotFound | `views/NotFound.vue` |
