# 个人博客网站技术规范 (SPEC)

## 项目概述
一个基于Vue 3 + Element Plus的纯静态个人博客网站，所有动态功能（登录、评论、数据管理）均为前端模拟实现，无后端服务。部署于GitHub Pages，主要用于技术演示和个人展示。

## 核心目标
- 展示Vue 3 + Element Plus技术栈能力
- 实现完整的博客UI/UX流程
- 通过客户端模拟演示动态功能
- 零服务器成本、易部署维护

## 功能需求

### 1. 页面板块（共14个，满足12+要求）
| 板块 | 路径 | 功能描述 | 技术实现 | 布局类型 |
|------|------|----------|----------|----------|
| 首页 | `/` | 文章列表展示、最新文章、热门标签、轮播图 | 静态生成 + 客户端排序/筛选 | 首页布局 |
| 关于我 | `/about` | 个人介绍、技能、经历、时间线 | 静态内容，可配置化 | 关于页布局 |
| 文章详情 | `/article/:id` | 文章内容展示、评论列表、评论表单、目录导航 | Markdown渲染 + 评论模拟 | 文章详情布局 |
| 工具 | `/tools` | 外部工具链接集合，分类筛选 | 链接卡片网格布局 | 工具网格布局 |
| 联系 | `/contact` | 模拟联系表单（无真实提交） | 表单验证 + 成功提示模拟 | 表单居中布局 |
| 登录 | `/login` | 用户登录/注销（硬编码凭证） | 本地会话模拟 + 路由守卫 | 认证卡片布局 |
| 注册 | `/register` | 模拟注册流程（无真实注册） | 表单验证 + 成功提示 | 认证卡片布局 |
| 用户中心 | `/profile` | 用户信息展示、我的评论、个人设置 | 本地数据展示 | 用户面板布局 |
| 标签归档 | `/tags` | 所有标签云，点击进入标签文章列表 | 标签统计与筛选 | 标签云布局 |
| 分类页面 | `/categories` | 文章分类导航，分类文章列表 | 分类数据组织 | 分类网格布局 |
| 搜索页面 | `/search` | 全文搜索（客户端搜索），搜索结果展示 | 前端搜索算法 | 搜索页面布局 |
| 文章归档 | `/archive` | 按年月归档的文章列表 | 时间分组统计 | 时间线布局 |
| 管理后台 | `/admin` | Admin管理面板（清空评论、查看数据） | 本地数据管理 | 管理表格布局 |
| 404页面 | `/*` | 自定义404错误页面，导航回首页 | 路由捕获 | 错误页布局 |

### 2. 用户系统（模拟）
- **用户角色**：普通用户、Admin（初始硬编码）+ 动态注册用户（仅本地）
- **初始硬编码用户**（不可修改）：
  | 用户名 | 密码 | 角色 | 用途 |
  |--------|------|------|------|
  | admin | admin123 | admin | 管理员演示 |
  | user1 | user123 | user | 普通用户演示 |
  | user2 | user456 | user | 普通用户演示 |
- **注册功能**：模拟注册流程，新用户信息存储于`localStorage`（键：`blog_users`）
  - 注册表单验证（用户名唯一性、密码强度）
  - 注册成功自动登录（生成模拟JWT，保存用户信息）
  - 注册用户仅限当前浏览器使用，无跨设备同步
- **登录方式**：用户名+密码（前端验证硬编码列表 + localStorage用户列表）
- **权限控制**：
  - 普通用户（包括注册用户）：可评论（需登录）
  - Admin：额外看到"管理”入口，可清空本地评论数据
- **会话管理**：JWT模拟（token存localStorage，无真实签发/验证）
- **联动流程**：
  1. 注册成功 → 自动登录 → 跳转到首页（已登录状态）
  2. 登录成功 → 更新全局认证状态 → 可立即发表评论
  3. 评论时自动关联当前用户ID和用户名
  4. 注销后清除token，但保留本地注册用户数据

### 3. 评论系统（客户端存储）
- **存储位置**：`localStorage`（键：`blog_comments`）
- **数据结构**：
  ```json
  {
    "id": "uuid",
    "articleId": "string",
    "userId": "string",
    "username": "string",
    "content": "string",
    "createdAt": "timestamp",
    "isDeleted": "boolean"
  }
  ```
- **功能限制**：
  - 评论仅在同一浏览器内共享（不同设备/用户无法看到）
  - 无审核、无垃圾过滤（客户端数据自担风险）
  - Admin可删除本地评论（仅影响当前浏览器）
- **操作流程**：
  1. 用户登录后，认证状态存储在`authStore`
  2. 发表评论时，从`authStore`获取当前`userId`和`username`
  3. 评论保存到`localStorage`，包含用户信息和时间戳
  4. 评论列表根据`articleId`筛选，按时间倒序排列
  5. 用户可看到自己的评论，Admin可删除任何评论（软删除标记）

### 4. 附加要求（课程/作业要求）

1. **页面层级**：至少3级页面（例如：首页 → 文章列表 → 文章详情）
2. **布局多样性**：不同布局的网页至少5种以上
   - 首页布局（带轮播图、文章网格）
   - 文章列表布局（带侧边栏）
   - 文章详情布局（两栏：内容+目录）
   - 工具页面布局（卡片网格）
   - 用户中心布局（个人面板）
   - 管理后台布局（表格+操作）
3. **页面数量**：网站页面总数为12个以上
   - 核心6页 + 扩展页：标签归档、分类页面、搜索页面、用户个人中心、设置页面、404页面、隐私政策、站点地图、友情链接、文章归档
4. **JavaScript动效**：2个以上
   - 首页文章轮播图（自动轮播 + 手动切换）
   - 点击跳到页面顶端（滚动到顶部按钮）
   - 动态数据展示（实时评论计数、阅读量动画）
   - 动态数据校验（登录表单实时验证）
5. **CSS规范**：必须使用CSS+DIV布局，且HTML代码与CSS代码分离
   - Vue单文件组件中CSS写在`<style>`标签内，符合分离要求
   - 禁止行内样式（style属性）和内联样式（style标签在HTML中）
   - 使用CSS预处理器（Sass/Scss可选）
6. **LOGO设计**：需使用Photoshop自行设计的LOGO体现网站特色
   - 不能使用AI及相关其他工具或网站自动生成
   - 提供PSD源文件及多种格式导出（PNG透明背景、SVG）
   - LOGO需出现在网站Header和Favicon

### 5. 内容管理
- **文章格式**：Markdown + YAML frontmatter（构建时转为JSON）
- **发布流程**：Git提交 → 手动构建 → 推送至GitHub Pages
- **更新频率**：低频（几周/月）
- **文章字段**：
  ```yaml
  title: "文章标题"
  date: "2023-10-01"
  tags: ["标签1", "标签2"]
  excerpt: "摘要"
  cover: "封面图URL"
  published: true
  ```

### 5. 数据管理（放弃项）
- ❌ 数据导入/导出功能（纯客户端无法实现集中管理）
- ❌ 跨设备数据同步
- ❌ 真实数据库备份

## 技术栈

### 前端框架
- **Vue 3**：Composition API + `<script setup>`
- **构建工具**：Vite 5.x
- **路由**：Vue Router 4.x
- **状态管理**：Pinia 2.x
- **UI组件库**：Element Plus（按需导入）

### CSS规范
- **分离要求**：HTML代码与CSS代码分离，Vue单文件组件中CSS必须写在`<style>`标签内
- **禁止行内样式**：不得使用`style`属性或`<style>`标签内联在HTML模板中
- **预处理器**：可选Sass/Scss（推荐），提升CSS可维护性
- **命名规范**：BEM或自定义前缀（如`.blog-header`）避免样式冲突
- **响应式设计**：使用媒体查询实现移动端适配，Element Plus栅格系统辅助

### 开发工具
- **包管理器**：npm / yarn / pnpm（任选）
- **代码规范**：ESLint（Vue官方推荐规则）+ Prettier
- **Git钩子**：Husky + lint-staged
- **TypeScript**：❌ 不使用（保持简单）

### 第三方库
- **Markdown解析**：markdown-it + front-matter
- **工具库**：dayjs（日期处理）、uuid（生成ID）
- **图标**：Element Plus图标组件（或考虑@element-plus/icons-vue）

### 构建与部署
- **部署目标**：GitHub Pages（纯静态托管）
- **构建命令**：`npm run build`
- **部署方式**：手动构建后推送`dist`到`gh-pages`分支
- **基础路径**：根据仓库名配置（如`/myBlog/`）

## 架构设计

### 项目结构
```
src/
├── assets/           # 静态资源（图片、样式）
├── components/       # 可复用组件
│   ├── layout/      # 布局组件（Header、Footer）
│   ├── blog/        # 博客相关组件（ArticleCard、CommentList）
│   └── common/      # 通用组件（Loading、Empty）
├── composables/     # Composition API 可组合函数
│   ├── useAuth.ts   # 认证逻辑
│   ├── useComments.ts # 评论管理
│   └── useArticles.ts # 文章数据
├── router/          # 路由配置
├── stores/          # Pinia store
│   ├── auth.ts      # 用户认证状态
│   ├── comment.ts   # 评论数据
│   └── article.ts   # 文章数据
├── views/           # 页面组件（共14个）
│   ├── Home.vue
│   ├── About.vue
│   ├── Article.vue
│   ├── Tools.vue
│   ├── Contact.vue
│   ├── Login.vue
│   ├── Register.vue
│   ├── Profile.vue
│   ├── Tags.vue
│   ├── Categories.vue
│   ├── Search.vue
│   ├── Archive.vue
│   ├── Admin.vue
│   └── NotFound.vue
├── constants/       # 常量定义
│   ├── storage-keys.js  # localStorage键名常量
│   ├── routes.js        # 路由路径常量
│   ├── api.js          # API端点常量（模拟）
│   ├── regex.js        # 正则表达式常量
│   └── theme.js        # 主题样式常量
├── utils/           # 工具函数
├── types/           # TypeScript类型（如使用）
├── data/            # 静态数据（构建时生成）
└── App.vue
```

### 数据流设计
1. **文章数据**：构建时Markdown → JSON → 打包进应用 → 运行时加载
2. **评论数据**：用户操作 → Pinia Store → localStorage持久化
3. **用户状态**：登录验证（硬编码）→ Pinia Store → localStorage token

### 状态管理策略
| Store | 数据来源 | 持久化 | 更新时机 |
|-------|----------|--------|----------|
| `auth` | localStorage + 硬编码凭证 | localStorage | 登录/注销 |
| `comment` | localStorage + 用户输入 | localStorage | 评论增删 |
| `article` | 构建时生成的JSON文件 | 无（只读） | 应用加载时 |

## 详细设计

### 1. 路由配置
```javascript
const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/about', name: 'About', component: () => import('@/views/About.vue') },
  {
    path: '/article/:id',
    name: 'Article',
    component: () => import('@/views/Article.vue'),
    props: true
  },
  { path: '/tools', name: 'Tools', component: () => import('@/views/Tools.vue') },
  { path: '/contact', name: 'Contact', component: () => import('@/views/Contact.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/Register.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/tags', name: 'Tags', component: () => import('@/views/Tags.vue') },
  { path: '/categories', name: 'Categories', component: () => import('@/views/Categories.vue') },
  { path: '/search', name: 'Search', component: () => import('@/views/Search.vue') },
  { path: '/archive', name: 'Archive', component: () => import('@/views/Archive.vue') },
  { path: '/admin', name: 'Admin', component: () => import('@/views/Admin.vue'), meta: { requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') }
]
```

### 2. 认证系统（模拟）
```javascript
// 硬编码用户数据（初始用户，不可修改）
const HARDCODED_USERS = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
  { id: '2', username: 'user1', password: 'user123', role: 'user' },
  { id: '3', username: 'user2', password: 'user456', role: 'user' }
]

// 本地注册用户存储键
const USER_STORAGE_KEY = 'blog_users'

// 获取所有用户（硬编码 + 本地注册）
function getAllUsers() {
  const localUsers = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '[]')
  return [...HARDCODED_USERS, ...localUsers]
}

// 注册流程
1. 用户填写用户名、密码、确认密码
2. 前端验证：用户名唯一性（不与现有用户重复）、密码强度
3. 验证通过 → 生成新用户对象（id、username、password、role: 'user'）
4. 保存到localStorage（USER_STORAGE_KEY）
5. 自动登录：生成模拟JWT，更新authStore
6. 跳转到首页或原页面

// 登录流程
1. 用户输入用户名/密码
2. 前端比对所有用户列表（getAllUsers()）
3. 匹配成功 → 生成模拟JWT（随机字符串）存localStorage
4. Pinia store更新登录状态（用户信息、角色）
5. 路由守卫检查需要登录的页面（如评论页）

// 注销流程
1. 清除localStorage中的JWT
2. authStore重置为未登录状态
3. 跳转到首页
```

### 3. 评论系统实现
```javascript
// 评论存储键名
const STORAGE_KEY = 'blog_comments'

// 核心操作
class CommentService {
  // 获取文章评论
  getComments(articleId) {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return all.filter(c => c.articleId === articleId && !c.isDeleted)
  }

  // 添加评论（需登录状态）
  addComment(articleId, content, userId) {
    const comment = {
      id: uuid(),
      articleId,
      userId,
      content,
      createdAt: Date.now(),
      isDeleted: false
    }
    // 保存到localStorage
    // 更新Pinia store
  }

  // Admin删除评论（软删除标记）
  deleteComment(commentId) {
    // 标记isDeleted: true
    // 仅对当前浏览器有效
  }
}
```

### 4. 文章系统
```javascript
// 构建时：Markdown → JSON
// 运行时：加载JSON文件
import articles from '../data/articles.json'

// 文章查找
function getArticle(id) {
  return articles.find(a => a.id === id)
}

// 文章列表（支持分页、筛选、排序）
function getArticles({ page = 1, tag, search } = {}) {
  // 客户端分页和筛选
}
```

### 5. 工具页面
- 外部工具链接卡片网格
- 每个工具：图标 + 名称 + 描述 + 外部链接（_blank打开）
- 支持按类别筛选

### 6. 联系页面
- 表单字段：姓名、邮箱、主题、消息
- 前端验证：必填、邮箱格式
- 提交处理：模拟网络请求（setTimeout）→ 显示成功提示
- 无真实数据发送

### 7. JavaScript动效实现

#### 7.1 首页文章轮播图
- **功能**：自动轮播（每5秒切换）+ 手动切换（左右箭头/指示点）
- **技术实现**：
  ```javascript
  // 使用Swiper.js或自定义Carousel组件
  // 轮播数据：推荐文章列表（从文章数据中筛选）
  // 自动轮播：setInterval + 清除机制（页面不可见时暂停）
  // 响应式：不同屏幕尺寸显示不同数量的幻灯片
  ```
- **动效**：淡入淡出/滑动过渡，CSS transition实现

#### 7.2 点击跳到页面顶端
- **功能**：滚动超过300px显示"回到顶部"按钮，点击平滑滚动到顶部
- **技术实现**：
  ```javascript
  // 监听scroll事件，显示/隐藏按钮（防抖优化）
  // 点击按钮：window.scrollTo({ top: 0, behavior: 'smooth' })
  // 按钮样式：固定定位在右下角，渐现/渐隐过渡
  ```
- **动效**：按钮出现/消失的透明度变化，平滑滚动

#### 7.3 动态数据展示
- **功能**：实时评论计数、文章阅读量动画（数字递增效果）
- **技术实现**：
  ```javascript
  // 数字动画：使用requestAnimationFrame实现数字递增效果
  // 评论计数：监听评论store变化，更新显示
  // 阅读量模拟：文章打开时阅读数+1（本地存储）
  ```
- **动效**：数字滚动效果，CSS计数器动画

#### 7.4 动态数据校验（登录表单）
- **功能**：实时验证用户名/密码格式，即时反馈
- **技术实现**：
  ```javascript
  // 表单字段绑定 + watch监听
  // 验证规则：用户名长度3-20，密码强度提示
  // 视觉反馈：验证通过/失败图标，错误提示信息
  // 防抖验证：输入后500ms触发验证，避免频繁验证
  ```
- **动效**：验证状态变化的颜色过渡，错误提示的滑入效果

#### 7.5 其他动效增强
- **页面切换过渡**：Vue Router的页面切换动画（淡入淡出）
- **悬停效果**：卡片悬停上浮、按钮波纹效果
- **加载动画**：数据加载时的骨架屏、旋转加载器

## 代码封装与可维护性设计

### 1. 组件封装原则
- **单一职责**：每个组件只做一件事，保持小巧专注（如`ArticleCard`只展示文章卡片，不处理业务逻辑）
- **可复用性**：组件通过props接收数据，通过emits发出事件，避免内部状态依赖
- **无副作用**：纯展示组件不直接修改全局状态，业务逻辑通过composables或store处理
- **插槽机制**：使用具名插槽和作用域插槽提供扩展点（如`AppLayout`的header、footer插槽）
- **默认值设计**：提供合理的props默认值，降低使用成本

### 2. 组合式函数（Composables）封装
- **认证逻辑**：`useAuth()`封装登录、注销、令牌管理、权限检查
- **评论管理**：`useComments()`封装评论CRUD、本地存储同步
- **文章数据**：`useArticles()`封装文章加载、筛选、分页
- **表单处理**：`useForm()`封装表单状态、验证、提交逻辑
- **动效控制**：`useCarousel()`、`useBackToTop()`封装动效逻辑
- **规则**：每个composable只关注一个领域，返回响应式状态和方法

### 3. 工具函数模块化
- **按功能分模块**：
  - `utils/date.js`：日期格式化、相对时间计算
  - `utils/string.js`：字符串处理、截断、Markdown清理
  - `utils/storage.js`：localStorage/IndexedDB封装（统一错误处理）
  - `utils/validation.js`：表单验证规则、正则表达式
  - `utils/dom.js`：DOM操作、滚动控制、事件监听封装
- **纯函数设计**：相同输入总是返回相同输出，无副作用
- **完整类型提示**：JSDoc注释说明参数、返回值、示例

### 4. 状态管理规范
- **Store分层**：
  - `authStore`：用户认证状态、角色、权限
  - `commentStore`：评论数据、操作
  - `articleStore`：文章数据、分类、标签
  - `uiStore`：UI状态（主题、侧边栏开关、加载状态）
- **Getter计算属性**：派生状态通过getter计算，避免重复逻辑
- **Action统一处理**：异步操作、错误处理、状态更新在action中完成
- **持久化策略**：重要状态自动持久化到localStorage（通过插件）

### 5. 常量集中管理
- **目录结构**：`src/constants/`专门存放常量定义文件
- **存储键名**：`storage-keys.js`定义所有localStorage键名常量
  ```javascript
  export const STORAGE_KEYS = {
    COMMENTS: 'blog_comments',
    USERS: 'blog_users',
    AUTH_TOKEN: 'auth_token',
    THEME: 'blog_theme'
  }
  ```
- **路由路径**：`routes.js`定义所有路由路径常量，避免硬编码字符串
  ```javascript
  export const ROUTES = {
    HOME: '/',
    ARTICLE: '/article/:id',
    LOGIN: '/login',
    // ...
  }
  ```
- **API端点**：`api.js`定义模拟API端点常量（虽无真实后端，但统一管理）
- **正则表达式**：`regex.js`集中所有验证正则（邮箱、用户名、密码强度）
- **样式常量**：`theme.js`定义CSS变量、颜色、间距、字体等
- **使用规范**：禁止在业务代码中直接使用字符串/数字字面量，必须引用常量

### 6. 配置外部化
- **环境配置**：`src/config/env.js`区分开发/生产环境API地址、功能开关
- **主题配置**：`src/config/theme.js`定义颜色、间距、断点，Element Plus主题覆盖
- **路由配置**：`src/router/routes.js`集中定义所有路由，meta信息标注权限
- **静态数据**：`src/data/`目录存放文章、工具链接等可配置数据

### 7. 错误处理与日志
- **统一错误边界**：`ErrorBoundary`组件捕获子组件错误，显示友好界面
- **API错误处理**：虽然无真实API，但模拟网络错误的统一处理模式
- **用户操作反馈**：成功/失败消息通过ElMessage统一显示
- **开发日志**：`debug`模块控制日志输出，生产环境自动关闭

### 8. 代码分割与性能
- **路由懒加载**：所有路由组件使用`() => import()`动态导入
- **组件异步加载**：大型组件（如富文本编辑器）按需加载
- **第三方库CDN**：非核心库（如chart.js）通过CDN引入，减小打包体积
- **图片优化**：WebP格式、懒加载、响应式图片srcset

### 9. 文档与注释
- **组件文档**：每个组件顶部使用JSDoc说明用途、props、slots、events
- **复杂逻辑注释**：算法、业务规则关键步骤添加注释
- **README驱动**：`README.md`包含项目结构、开发指南、部署步骤
- **变更日志**：`CHANGELOG.md`记录版本更新

### 10. 可扩展性设计
- **插件机制**：预留插件注册点，未来可添加新功能模块
- **主题系统**：CSS变量实现主题切换，支持暗黑模式
- **国际化准备**：文本内容通过`$t`函数调用，预留多语言结构
- **API抽象层**：虽然当前模拟，但网络请求封装为`api/`模块，便于未来接入真实后端

## 组件设计

### 核心组件清单
1. **AppLayout**：主布局（Header + Main + Footer）
2. **ArticleCard**：文章卡片（用于首页列表）
3. **CommentList**：评论列表展示
4. **CommentForm**：评论提交表单
5. **MarkdownRenderer**：Markdown内容渲染器
6. **TagCloud**：标签云组件
7. **ToolCard**：工具链接卡片
8. **ContactForm**：联系表单
9. **AuthGuard**：路由守卫包装组件
10. **AdminPanel**：Admin管理面板（清空评论等）
11. **Carousel**：首页轮播图组件（自动/手动切换）
12. **BackToTop**：回到顶部按钮（滚动显示/隐藏，平滑滚动）
13. **CounterAnimation**：数字动画组件（阅读量、评论数递增效果）
14. **FormValidator**：表单实时验证组件（视觉反馈）
15. **LoadingSkeleton**：骨架屏加载组件（文章列表、详情页）
16. **SearchBox**：搜索框组件（实时搜索建议）
17. **Pagination**：分页组件（文章列表分页）
18. **CategoryFilter**：分类筛选组件（标签/分类过滤）

### Element Plus集成
- 按需导入配置（unplugin-vue-components）
- 主题色自定义（主色、成功色、警告色等）
- 响应式断点适配
- 全局组件注册（ElButton、ElInput等常用组件）

## 构建与部署

### 开发环境
```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 代码检查
npm run lint

# 格式化
npm run format
```

### 生产构建
```bash
# 构建静态文件（输出到dist目录）
npm run build

# 预览构建结果
npm run preview
```

### GitHub Pages部署流程
1. 构建：`npm run build`
2. 进入dist目录：`cd dist`
3. 初始化Git仓库（如需要）
4. 添加文件并提交
5. 推送到gh-pages分支：`git push origin gh-pages`
6. 在GitHub仓库Settings → Pages中设置源分支

### 构建优化
- **代码分割**：路由级懒加载
- **资源压缩**：Vite默认开启
- **图片优化**：建议手动压缩，或使用image-webpack-loader
- **CDN配置**：Element Plus等库可配置CDN引入（减少打包体积）

## 开发规范

### 代码风格
- 使用Composition API + `<script setup>`语法
- 组件名使用PascalCase（如`ArticleCard.vue`）
- 变量/函数名使用camelCase
- CSS类名使用kebab-case
- 优先使用Element Plus组件，自定义样式需加命名空间（如`.blog-article`）

### 提交规范（可选）
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具更新
```

### 性能注意事项
1. **文章图片**：使用懒加载（`loading="lazy"`）
2. **评论列表**：虚拟滚动（如文章评论过多）
3. **状态持久化**：localStorage操作需防抖/节流
4. **构建产物**：监控打包体积，避免单文件过大

## 风险与限制

### 技术限制
1. **数据不共享**：评论、用户数据仅限当前浏览器
2. **无真实安全**：密码硬编码，JWT模拟，无服务器验证
3. **无法扩展**：无法添加真实用户、真实评论审核
4. **SEO有限**：动态内容（评论）不被搜索引擎收录

### 安全警告
⚠️ **重要**：此项目仅为演示用途，不适合生产环境！
- 密码暴露在前端代码中
- 无防暴力破解机制
- 无XSS/CSRF防护（评论内容直接显示）
- 管理功能仅在本地有效

### 维护考虑
- 文章更新需重新构建部署
- 无备份机制（localStorage可被用户清除）
- 浏览器兼容性：现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

## 未来扩展点（如改为真实应用）
1. **后端API**：Node.js/Express或Python FastAPI
2. **数据库**：MongoDB/PostgreSQL/MySQL
3. **真实认证**：JWT + bcrypt密码哈希
4. **评论审核**：Admin后台审核队列
5. **数据导入导出**：JSON/CSV文件处理
6. **邮件通知**：新评论通知、联系表单转发
7. **数据分析**：访问统计、热门文章

## 验收标准
### 基础功能
- [ ] 14个页面均可正常访问（满足12+要求）
- [ ] 至少3级页面深度（首页 → 文章列表 → 文章详情）
- [ ] 5种以上不同布局（首页、详情、工具、用户中心、管理后台等）
- [ ] 文章列表/详情可正常显示（Markdown渲染）
- [ ] 登录/注销功能正常（硬编码账号，角色区分）
- [ ] 评论可提交/显示（当前浏览器内）
- [ ] Admin可看到管理入口并管理本地数据
- [ ] 工具页面链接正常跳转（外部链接）
- [ ] 联系表单模拟提交成功（验证+提示）
- [ ] 响应式设计（桌面/平板/手机）

### JavaScript动效（2+要求）
- [ ] 首页文章轮播图（自动轮播+手动切换）
- [ ] 点击跳到页面顶端按钮（滚动显示/隐藏，平滑滚动）
- [ ] 动态数据展示（阅读量/评论数动画）
- [ ] 动态数据校验（登录表单实时验证）
- [ ] 页面切换过渡动画（Vue Router）
- [ ] 悬停交互效果（卡片上浮、按钮波纹）

### CSS规范
- [ ] HTML与CSS代码分离（Vue单文件组件`<style>`）
- [ ] 无行内样式（`style`属性）和内联样式
- [ ] 使用CSS预处理器（Sass/Scss可选）
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

## 附录

### 硬编码用户账号（示例）
| 用户名 | 密码 | 角色 | 用途 |
|--------|------|------|------|
| admin | admin123 | admin | 管理员演示 |
| user1 | user123 | user | 普通用户演示 |
| user2 | user456 | user | 普通用户演示 |

### 文章目录结构示例
```
content/
├── articles/
│   ├── 2023-10-01-hello-world.md
│   ├── 2023-10-05-vue3-tips.md
│   └── 2023-10-10-element-plus-guide.md
└── config.json     # 站点配置（标题、描述等）
```

### 构建脚本示例（package.json）
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs",
    "format": "prettier --write src/",
    "build:content": "node scripts/build-content.js"
  }
}
```

---
*文档版本：1.0*
*最后更新：2026-04-12*
*项目类型：演示/原型*
*技术栈：Vue 3 + Element Plus + Vite*