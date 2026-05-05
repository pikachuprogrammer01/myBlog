# 状态管理（Pinia Store）

三个 Pinia Store 覆盖认证、文章、评论三大核心领域。均采用 Setup Store 语法（Composition API 风格）。

## 架构

```
视图层 (Views/Components)
     │
     ▼
组合层 (Composables)        ← 封装 Store 调用，提供简洁 API
     │
     ▼
状态层 (Pinia Stores)       ← 全局共享状态 + API 调用
     │
     ▼
服务层 (API Services)       ← HTTP 请求
```

---

## Auth Store (`stores/auth.js`)

管理用户认证状态和 JWT Token。

### 状态

| 属性 | 类型 | 说明 |
|------|------|------|
| `user` | `Ref<Object\|null>` | 当前登录用户信息 |
| `token` | `Ref<String\|null>` | JWT Token |
| `loading` | `Ref<Boolean>` | 加载状态 |
| `isAuthenticated` | `Computed<Boolean>` | 是否已认证（token + user 同时存在） |
| `isAdmin` | `Computed<Boolean>` | 是否为管理员 |

### 方法

| 方法 | 说明 |
|------|------|
| `login(username, password)` | 登录，成功后持久化 token 和 user 到 localStorage |
| `register(username, password)` | 注册，自动登录并持久化 |
| `restoreSession()` | 用已存储的 token 向 API 验证有效性，恢复登录态 |
| `logout()` | 清除 token 和 user |
| `updateAvatarUrl(imageBase64)` | 上传头像并更新本地状态 |
| `removeAvatarUrl()` | 删除头像并更新本地状态 |

### 持久化

- `token` → `localStorage` (`AUTH_TOKEN`)
- `user` → `localStorage` (`CURRENT_USER`)
- 页面刷新后通过 `restoreSession()` 恢复

---

## Article Store (`stores/article.js`)

管理文章数据、分类、搜索和互动（点赞、收藏）。

### 状态

| 属性 | 类型 | 说明 |
|------|------|------|
| `articles` | `Ref<Array>` | 文章列表 |
| `categories` | `Ref<Array>` | 分类列表 |
| `loading` | `Ref<Boolean>` | 加载状态 |

### 数据加载

采用 **Cache-First + Stale-While-Revalidate** 策略：

1. 优先读取 `localStorage` 缓存 → 立即渲染
2. 缓存不存在时使用静态 JSON（`data/articles.json`）兜底
3. 后台 API 刷新 → 更新缓存

### 主要方法

| 方法 | 说明 |
|------|------|
| `loadArticles(force)` | 加载文章列表（支持强制刷新） |
| `loadCategories(force)` | 加载分类列表 |
| `getAllArticles()` | 获取所有已发布文章（过滤草稿，按日期倒序） |
| `getArticleById(id)` | 根据 ID 或 slug 获取单篇文章 |
| `searchArticles(keyword)` | 全文搜索（标题、摘要、内容、标签、分类） |
| `getArticlesByTag(tag)` | 按标签筛选文章 |
| `getArticlesByCategory(categoryId)` | 按分类筛选文章 |
| `getPreviousNextArticles(currentId)` | 获取上一页/下一页文章 |
| `toggleLike(slug)` | 切换文章点赞状态 |
| `getLikeStatus(slug)` | 获取文章点赞状态与数量 |
| `toggleBookmark(slug)` | 切换文章收藏状态 |
| `getBookmarkStatus(slug)` | 获取文章收藏状态 |
| `getBookmarks()` | 获取当前用户的收藏列表 |
| `getTotalViews()` | 计算总浏览量 |
| `invalidateCache()` | 清除缓存 |

### 计算属性

| 属性 | 说明 |
|------|------|
| `getPopularTags` | 热门标签 Top 10（按文章数排序） |
| `getArticlesByArchive` | 按年月归档的文章列表 |

---

## Comment Store (`stores/comment.js`)

管理文章评论的 CRUD、嵌套展示、置顶和点赞。

### 状态

| 属性 | 类型 | 说明 |
|------|------|------|
| `articleComments` | `Ref<Object>` | 按文章 slug 索引的评论列表 |
| `loading` | `Ref<Boolean>` | 加载状态 |

### 主要方法

| 方法 | 说明 |
|------|------|
| `loadComments(articleSlug)` | 加载指定文章的评论 |
| `getCachedComments(articleSlug)` | 获取已缓存的评论（不触发 API 请求） |
| `getCommentTree(articleSlug)` | 构建嵌套评论树（父评论 + replies 数组） |
| `addComment(articleSlug, content, parentId)` | 添加评论（支持回复） |
| `updateComment(commentId, content)` | 编辑评论 |
| `deleteComment(commentId)` | 软删除评论 |
| `batchDeleteComments(ids)` | 批量软删除（管理员） |
| `permanentDeleteComment(commentId)` | 永久删除（管理员） |
| `toggleSticky(commentId)` | 切换置顶状态（管理员） |
| `likeComment(commentId)` | 点赞/取消点赞评论 |

### 评论数据结构

```js
{
  id: Number,           // 评论 ID
  articleId: String,    // 所属文章 slug
  parentId: Number,     // 父评论 ID（null 为顶级评论）
  userId: Number,       // 作者用户 ID
  username: String,     // 作者用户名
  content: String,      // 评论内容（Markdown）
  createdAt: String,    // 创建时间
  isDeleted: Boolean,   // 是否已软删除
  likes: Number,        // 点赞数
  liked: Boolean,       // 当前用户是否已点赞
}
```
