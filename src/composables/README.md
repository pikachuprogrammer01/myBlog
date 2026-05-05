# 组合式函数（Composables）

Vue 3 组合式函数，封装 Store 调用和页面级业务逻辑，提供更简洁的组件 API。

## 概述

Composables 是 Pinia Store 与视图组件之间的桥梁：
- Store 负责原始的状态管理和 API 调用
- Composable 负责包装 Store 方法，提供类型安全、默认值和计算属性
- 组件通过 Composable 获取状态和方法，无需直接操作 Store

## Composable 列表

| Composable | 文件 | 用途 |
|-----------|------|------|
| `useAuth` | `useAuth.js` | 认证操作封装 |
| `useArticles` | `useArticles.js` | 文章操作封装 |
| `useComments` | `useComments.js` | 评论操作封装 |
| `useHomeArticles` | `useHomeArticles.js` | 首页分页与布局状态 |
| `useNavigationLoading` | `useNavigationLoading.js` | 页面导航加载状态 |

---

## useAuth

```js
const {
  currentUser,      // Computed — 当前用户信息
  isAuthenticated,  // Computed — 是否已登录
  isAdmin,          // Computed — 是否为管理员
  login,            // (username, password) → { success, message }
  register,         // (username, password) → { success, message }
  logout,           // () → void
  restoreSession,   // () → Boolean
  updateAvatar,     // (imageBase64) → Response
  removeAvatar,     // () → Response
} = useAuth()
```

封装 `useAuthStore`，提供认证相关的计算属性和方法。

---

## useArticles

```js
const {
  loadArticles,
  loadCategories,
  getArticles,         // → Array — 所有已发布文章
  getArticle,          // (id) → Object — 单篇文章
  searchArticles,      // (keyword) → Array
  getPopularTags,      // → Array — 热门标签 Top 10
  getArchive,          // → Array — 按年月归档
  getCategories,       // → Array — 分类列表
  toggleLike,          // (slug) → { liked, likes }
  getLikeStatus,       // (slug) → { liked, likes }
  toggleBookmark,      // (slug) → { bookmarked }
  getBookmarkStatus,   // (slug) → { bookmarked, bookmarks }
  getBookmarks,        // → Array — 用户收藏列表
  getArticlesByTag,    // (tag) → Array
  getArticlesByCategory, // (categoryId) → Array
  getTotalViews,       // → Number
  invalidateCache,     // → void
} = useArticles()
```

封装 `useArticleStore`，提供文章相关的全部操作。

---

## useComments

```js
const {
  getComments,           // (articleSlug) → Array
  getCommentTree,        // (articleSlug) → Array — 嵌套树结构
  loadComments,          // (articleSlug) → Array
  addComment,            // (articleSlug, content, parentId?) → { success, comment }
  updateComment,         // (commentId, content) → { success, message }
  deleteComment,         // (commentId) → { success, message }
  batchDeleteComments,   // (ids) → { success, deletedCount }
  permanentDeleteComment,// (commentId) → { success, message }
  toggleSticky,          // (commentId) → { success, sticky }
  likeComment,           // (commentId) → { success, likes, liked }
  getCommentsCount,      // (articleSlug) → Number
  getTotalCommentCount,  // → Ref<Number>
  loadTotalCommentCount, // → void
} = useComments()
```

封装 `useCommentStore`，提供评论相关的全部操作。

---

## useHomeArticles

```js
const {
  layout,            // Ref<'grid'|'list'> — 文章展示布局
  currentPage,       // Ref<Number> — 当前页码
  pageSize,          // Ref<Number> — 每页条数（6）
  total,             // Computed<Number> — 文章总数
  articles,          // Computed<Array> — 当前页文章
  featuredArticles,  // Computed<Array> — 轮播图推荐文章（前 3 篇有封面的）
  popularTags,       // Computed<Array> — 热门标签
} = useHomeArticles()
```

首页专用 Composable，管理分页状态、布局切换和推荐文章筛选。

---

## useNavigationLoading

```js
const {
  isNavigating,     // Ref<Boolean> — 是否正在导航
  startNavigation,  // () → void — 开始导航
  endNavigation,    // () → void — 结束导航
} = useNavigationLoading()
```

全局页面导航加载状态，供 Main.vue 的页面过渡动画使用。

## 使用示例

```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const { currentUser, isAuthenticated, login } = useAuth()

async function handleLogin() {
  const result = await login(username, password)
  if (result.success) {
    router.push('/')
  }
}
</script>
```
