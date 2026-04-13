# Vue 3博客项目实现计划

## 概述
本文档详细描述了如何根据SPEC.md规范实现Vue 3静态个人博客项目。项目当前为空，需要从头开始构建所有功能。技术栈为Vue 3 + Element Plus + Vite + Vue Router + Pinia。

## 参考文档
- [SPEC.md](./SPEC.md) - 完整技术规范
- [CLAUDE.md](./CLAUDE.md) - 开发指导和项目结构

## 核心要求总结

### 功能要求
1. **14个页面**：首页、关于我、文章详情、工具、联系、登录、注册、用户中心、标签归档、分类页面、搜索页面、文章归档、管理后台、404页面
2. **5种以上布局**：首页、详情、工具、用户中心、管理后台等不同布局
3. **至少2个JavaScript动效**：轮播图、回到顶部按钮
4. **CSS规范**：分离、无行内样式、可选预处理器
5. **认证系统**：硬编码用户+本地注册、JWT模拟、角色权限
6. **评论系统**：localStorage存储、CRUD操作
7. **文章系统**：Markdown构建为JSON、客户端加载
8. **LOGO设计**：Photoshop自行设计、非AI生成
9. **部署**：GitHub Pages

### 技术栈
- **框架**：Vue 3 (Composition API, `<script setup>`)
- **构建**：Vite 5.x
- **路由**：Vue Router 4.x
- **状态管理**：Pinia 2.x
- **UI库**：Element Plus (按需导入)
- **Markdown**：markdown-it + front-matter
- **工具库**：dayjs、uuid

## 项目结构

```
myBlog/
├── content/                    # Markdown文章源文件
│   └── articles/              # 文章目录
├── scripts/                   # 构建脚本
│   └── build-content.js       # Markdown转JSON脚本
├── public/                    # 静态资源
├── src/
│   ├── assets/               # 静态资源（图片、样式）
│   ├── components/           # 可复用组件
│   │   ├── layout/          # 布局组件
│   │   ├── blog/            # 博客相关组件
│   │   └── common/          # 通用组件
│   ├── composables/         # Composition API函数
│   ├── stores/              # Pinia store
│   ├── views/               # 14个页面组件
│   ├── router/              # 路由配置
│   ├── constants/           # 常量定义
│   ├── utils/               # 工具函数
│   ├── data/                # 构建时生成的JSON数据
│   └── App.vue
├── index.html
├── vite.config.js
├── package.json
├── SPEC.md
├── CLAUDE.md
└── IMPLEMENTATION_PLAN.md
```

## 详细实施步骤

### 阶段1：项目初始化（第1天）

#### 1.1 创建Vue 3项目
```bash
npm create vue@latest myBlog
cd myBlog
```

选择功能：
- ✅ TypeScript（根据SPEC.md，不使用TypeScript，选择"No"）
- ✅ JSX Support: No
- ✅ Vue Router: Yes
- ✅ Pinia: Yes
- ✅ ESLint: Yes
- ✅ Prettier: Yes

#### 1.2 安装Element Plus
```bash
npm install element-plus
```

#### 1.3 安装其他依赖
```bash
npm install dayjs uuid markdown-it front-matter
npm install -D sass
```

#### 1.4 配置Vite (vite.config.js)
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  base: process.env.NODE_ENV === 'production' ? '/myBlog/' : '/',
})
```

#### 1.5 创建目录结构
```bash
mkdir -p src/{assets,components/{layout,blog,common},composables,stores,views,router,constants,utils,data}
mkdir -p content/articles scripts
```

### 阶段2：核心系统实现（第2-4天）

#### 2.1 认证系统实现

**文件：`src/constants/storage-keys.js`**
```javascript
export const STORAGE_KEYS = {
  COMMENTS: 'blog_comments',
  USERS: 'blog_users',
  AUTH_TOKEN: 'auth_token',
  THEME: 'blog_theme'
}
```

**文件：`src/constants/users.js`**
```javascript
// 硬编码用户（不可修改）
export const HARDCODED_USERS = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
  { id: '2', username: 'user1', password: 'user123', role: 'user' },
  { id: '3', username: 'user2', password: 'user456', role: 'user' }
]
```

**文件：`src/stores/auth.js`**
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { HARDCODED_USERS } from '@/constants/users'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null)
  
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  // 登录功能
  const login = (username, password) => {
    // 验证逻辑
    // 生成模拟token
    // 更新状态
  }
  
  // 注册功能
  const register = (username, password) => {
    // 验证用户名唯一性
    // 创建新用户
    // 保存到localStorage
    // 自动登录
  }
  
  // 注销功能
  const logout = () => {
    // 清除token
    // 重置状态
  }
  
  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout
  }
})
```

**文件：`src/composables/useAuth.js`**
```javascript
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()
  
  // 检查用户是否登录
  const checkAuth = () => {
    return authStore.isAuthenticated
  }
  
  // 检查是否为管理员
  const checkAdmin = () => {
    return authStore.isAdmin
  }
  
  // 获取当前用户
  const getCurrentUser = () => {
    return authStore.user
  }
  
  return {
    checkAuth,
    checkAdmin,
    getCurrentUser
  }
}
```

#### 2.2 评论系统实现

**文件：`src/stores/comment.js`**
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref([])
  
  // 加载评论
  const loadComments = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS)
    comments.value = stored ? JSON.parse(stored) : []
  }
  
  // 获取文章评论
  const getArticleComments = (articleId) => {
    return comments.value.filter(
      comment => comment.articleId === articleId && !comment.isDeleted
    ).sort((a, b) => b.createdAt - a.createdAt)
  }
  
  // 添加评论
  const addComment = (articleId, content, userId, username) => {
    const newComment = {
      id: generateId(),
      articleId,
      userId,
      username,
      content,
      createdAt: Date.now(),
      isDeleted: false
    }
    
    comments.value.push(newComment)
    saveComments()
    return newComment
  }
  
  // 删除评论（软删除）
  const deleteComment = (commentId) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index !== -1) {
      comments.value[index].isDeleted = true
      saveComments()
    }
  }
  
  // 保存到localStorage
  const saveComments = () => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments.value))
  }
  
  // 生成ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  return {
    comments,
    loadComments,
    getArticleComments,
    addComment,
    deleteComment
  }
})
```

#### 2.3 文章系统实现

**文件：`scripts/build-content.js`**
```javascript
const fs = require('fs')
const path = require('path')
const matter = require('front-matter')
const markdownIt = require('markdown-it')

const md = markdownIt()
const contentDir = path.join(__dirname, '../content/articles')
const outputFile = path.join(__dirname, '../src/data/articles.json')

function buildArticles() {
  const articles = []
  const files = fs.readdirSync(contentDir)
  
  files.forEach(file => {
    if (path.extname(file) === '.md') {
      const content = fs.readFileSync(path.join(contentDir, file), 'utf-8')
      const parsed = matter(content)
      
      const article = {
        id: path.basename(file, '.md'),
        ...parsed.attributes,
        content: md.render(parsed.body)
      }
      
      articles.push(article)
    }
  })
  
  // 按日期排序
  articles.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  // 写入JSON文件
  fs.writeFileSync(outputFile, JSON.stringify(articles, null, 2))
  console.log(`构建完成，共生成 ${articles.length} 篇文章`)
}

buildArticles()
```

**文件：`src/stores/article.js`**
```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import articlesData from '@/data/articles.json'

export const useArticleStore = defineStore('article', () => {
  const articles = ref(articlesData)
  
  // 获取所有文章
  const getAllArticles = () => {
    return articles.value
  }
  
  // 根据ID获取文章
  const getArticleById = (id) => {
    return articles.value.find(article => article.id === id)
  }
  
  // 根据标签获取文章
  const getArticlesByTag = (tag) => {
    return articles.value.filter(article => 
      article.tags && article.tags.includes(tag)
    )
  }
  
  // 搜索文章
  const searchArticles = (keyword) => {
    const lowerKeyword = keyword.toLowerCase()
    return articles.value.filter(article => 
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.excerpt.toLowerCase().includes(lowerKeyword) ||
      article.content.toLowerCase().includes(lowerKeyword)
    )
  }
  
  return {
    articles,
    getAllArticles,
    getArticleById,
    getArticlesByTag,
    searchArticles
  }
})
```

### 阶段3：路由和布局配置（第5天）

#### 3.1 路由配置

**文件：`src/router/index.js`**
```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/article/:id',
    name: 'Article',
    component: () => import('@/views/Article.vue'),
    props: true
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/Tools.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/views/Contact.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/Tags.vue')
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('@/views/Categories.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/views/Archive.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
    return
  }
  
  next()
})

export default router
```

#### 3.2 主布局组件

**文件：`src/components/layout/AppLayout.vue`**
```vue
<template>
  <div class="app-layout">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
    <BackToTop />
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import BackToTop from '@/components/common/BackToTop.vue'
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  
  .main-content {
    flex: 1;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
}
</style>
```

### 阶段4：页面组件开发（第6-10天）

#### 4.1 首页 (Home.vue)
- 轮播图组件展示推荐文章
- 文章列表网格布局
- 热门标签云
- 最新文章侧边栏

#### 4.2 文章详情页 (Article.vue)
- Markdown内容渲染
- 评论列表和评论表单
- 文章信息（日期、标签、阅读量）
- 上一篇/下一篇导航

#### 4.3 认证页面 (Login.vue, Register.vue)
- 表单验证和实时反馈
- 错误提示和成功消息
- 记住登录状态选项

#### 4.4 用户中心 (Profile.vue)
- 用户信息展示
- 我的评论列表
- 个人设置选项

#### 4.5 管理后台 (Admin.vue)
- 评论管理表格
- 数据统计面板
- 清空本地数据功能

#### 4.6 其他页面
- 关于我、工具、联系页面
- 标签、分类、搜索、归档页面
- 404错误页面

### 阶段5：动效组件实现（第11-12天）

#### 5.1 轮播图组件 (Carousel.vue)
```vue
<template>
  <div class="carousel">
    <!-- 实现轮播图逻辑 -->
  </div>
</template>

<script setup>
// 自动轮播、手动切换、响应式适配
</script>
```

#### 5.2 回到顶部组件 (BackToTop.vue)
```vue
<template>
  <transition name="fade">
    <button 
      v-if="visible" 
      class="back-to-top"
      @click="scrollToTop"
    >
      ↑
    </button>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)

const handleScroll = () => {
  visible.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
```

### 阶段6：样式和优化（第13-14天）

#### 6.1 CSS架构
- 使用Sass预处理器
- BEM命名规范，`.blog-`前缀
- 响应式设计，移动端优先
- 主题变量系统

**文件：`src/assets/styles/main.scss`**
```scss
// 主题变量
:root {
  --blog-primary-color: #409eff;
  --blog-secondary-color: #67c23a;
  --blog-text-color: #303133;
  --blog-bg-color: #f5f7fa;
  --blog-border-color: #dcdfe6;
}

// 全局样式
.blog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

// 响应式断点
$breakpoints: (
  'sm': 640px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px
);

@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

#### 6.2 性能优化
- 路由懒加载
- 图片懒加载
- 代码分割
- 第三方库CDN引入（可选）

### 阶段7：测试和部署（第15天）

#### 7.1 测试
- 单元测试（Vitest）
- E2E测试（Cypress）
- 跨浏览器测试

#### 7.2 部署到GitHub Pages
1. 配置vite.config.js中的base路径
2. 构建项目：`npm run build`
3. 部署到gh-pages分支

**package.json脚本**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "build:content": "node scripts/build-content.js",
    "lint": "eslint . --ext .vue,.js",
    "format": "prettier --write src/",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

## 验收标准检查清单

### 基础功能
- [ ] 14个页面均可正常访问
- [ ] 至少3级页面深度（首页 → 文章列表 → 文章详情）
- [ ] 5种以上不同布局
- [ ] 文章列表/详情正常显示（Markdown渲染）
- [ ] 登录/注销功能正常（硬编码账号，角色区分）
- [ ] 评论可提交/显示（当前浏览器内）
- [ ] Admin可看到管理入口并管理本地数据
- [ ] 工具页面链接正常跳转
- [ ] 联系表单模拟提交成功
- [ ] 响应式设计（桌面/平板/手机）

### JavaScript动效
- [ ] 首页文章轮播图（自动轮播+手动切换）
- [ ] 点击跳到页面顶端按钮（滚动显示/隐藏，平滑滚动）
- [ ] 动态数据展示（阅读量/评论数动画）
- [ ] 动态数据校验（登录表单实时验证）

### CSS规范
- [ ] HTML与CSS代码分离（Vue单文件组件`<style>`）
- [ ] 无行内样式（`style`属性）和内联样式
- [ ] 使用CSS预处理器（Sass/Scss）
- [ ] 符合BEM或前缀命名规范
- [ ] 响应式媒体查询完整

### LOGO与设计
- [ ] 使用Photoshop自行设计LOGO（非AI生成）
- [ ] LOGO出现在Header和Favicon
- [ ] 提供PSD源文件及导出格式（PNG、SVG）
- [ ] 界面美观、内容充实

### 部署与质量
- [ ] 部署到GitHub Pages可访问
- [ ] 无浏览器console错误
- [ ] ESLint代码规范检查通过
- [ ] 构建产物优化（压缩、代码分割）

## 风险与缓解

### 技术风险
1. **localStorage容量限制**（5MB）
   - 缓解：评论数据定期清理，文章数据不存储

2. **浏览器兼容性**
   - 缓解：定位现代浏览器，使用polyfill必要时

3. **性能问题**
   - 缓解：代码分割、图片懒加载、虚拟滚动

### 项目风险
1. **时间估算不足**
   - 缓解：优先实现核心功能，可选功能后续添加

2. **规范符合度遗漏**
   - 缓解：定期对照SPEC.md检查清单

3. **部署问题**
   - 缓解：提前测试部署流程，文档化步骤

## 后续维护

### 文章更新流程
1. 在`content/articles/`目录添加Markdown文件
2. 运行`npm run build:content`生成JSON
3. 重新构建项目：`npm run build`
4. 部署到GitHub Pages

### 功能扩展建议
1. **暗黑模式**：CSS变量实现主题切换
2. **PWA支持**：添加Service Worker实现离线访问
3. **评论审核**：Admin后台审核评论
4. **数据分析**：访问统计、热门文章

## 总结

本实现计划提供了从零开始构建Vue 3博客项目的完整指导。按照此计划，可以系统性地实现所有SPEC.md要求的功能，并确保代码质量和可维护性。每个阶段都有明确的目标和交付物，便于跟踪进度和验收。

**关键成功因素**：
1. 严格遵循SPEC.md规范
2. 采用模块化、可维护的代码结构
3. 实现所有必需的动效和布局
4. 确保响应式设计和跨浏览器兼容性
5. 完成完整的测试和部署流程

按照此计划，预计需要15个工作日完成所有开发工作，交付一个符合所有规范要求的静态个人博客网站。