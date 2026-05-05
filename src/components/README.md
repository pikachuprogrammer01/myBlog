# 组件库

Vue 3 通用组件，按功能分为 5 个子目录，共 23 个组件。

## 组件分类

```
components/
├── admin/      # 管理后台组件（11 个）
├── blog/       # 博客功能组件（5 个）
├── common/     # 通用组件（1 个）
├── home/       # 首页组件（3 个）
└── layout/     # 布局组件（3 个）
```

---

## 管理后台组件 (`components/admin/`)

用于 Admin.vue 管理面板，通过 `el-tabs` 切换展示。

| 组件 | 文件 | 功能 |
|------|------|------|
| AdminChart | `AdminChart.vue` | ECharts 图表封装，支持自适应 resize |
| AdminStats | `AdminStats.vue` | 数据概览统计卡片（文章数、评论数、用户数、浏览量） |
| ArticleManager | `ArticleManager.vue` | 文章 CRUD 管理面板（列表、创建、编辑、删除） |
| ArticleStatsTable | `ArticleStatsTable.vue` | 文章数据统计表格（浏览量、点赞数、评论数） |
| CommentManager | `CommentManager.vue` | 评论管理面板（列表、批量删除、永久删除） |
| DataActions | `DataActions.vue` | 数据操作按钮组（导出 Excel、清空评论、重置数据、测试邮件） |
| InterviewManager | `InterviewManager.vue` | 题库管理面板（题目 CRUD） |
| ProjectManager | `ProjectManager.vue` | 项目管理面板（项目 CRUD） |
| TagManager | `TagManager.vue` | 标签管理面板（标签 CRUD） |
| ToolManager | `ToolManager.vue` | 工具管理面板（工具 CRUD） |
| UserManager | `UserManager.vue` | 用户管理面板（用户列表、角色管理） |

## 博客组件 (`components/blog/`)

文章展示与评论交互的核心组件。

| 组件 | 文件 | 功能 |
|------|------|------|
| ArticleCard | `ArticleCard.vue` | 文章卡片，支持网格/列表两种布局模式 |
| ArticleList | `ArticleList.vue` | 文章列表容器（分页、排序） |
| CommentForm | `CommentForm.vue` | 评论提交表单（支持回复嵌套） |
| CommentList | `CommentList.vue` | 嵌套评论列表展示（递归渲染） |
| MarkdownRenderer | `MarkdownRenderer.vue` | Markdown 内容渲染器（marked + 代码高亮） |

## 首页组件 (`components/home/`)

首页专用组件。

| 组件 | 文件 | 功能 |
|------|------|------|
| Carousel | `Carousel.vue` | 首页轮播图（封装 el-carousel，展示推荐文章） |
| SectionHeader | `SectionHeader.vue` | 首页区域标题，支持网格/列表布局切换 |
| Sidebar | `Sidebar.vue` | 首页侧边栏（热门标签、统计信息） |

## 布局组件 (`components/layout/`)

全局布局框架组件。

| 组件 | 文件 | 功能 |
|------|------|------|
| Header | `Header.vue` | 全局顶部导航栏（Logo、菜单、用户状态） |
| Footer | `Footer.vue` | 全局页脚（链接、版权信息、评论统计） |
| Main | `Main.vue` | 主内容区容器（router-view + 页面过渡动画） |

## 通用组件 (`components/common/`)

| 组件 | 文件 | 功能 |
|------|------|------|
| BackToTop | `BackToTop.vue` | 回到顶部按钮，滚动触发显示/隐藏，平滑滚动 |

## 组件自动注册

项目使用 `unplugin-vue-components` 自动注册 `src/components/` 下的组件，**无需手动 import**。组件类型声明自动生成在 `src/components.d.ts` 中。

Element Plus 组件同样自动按需导入（通过 `ElementPlusResolver`）。

## 新增组件指南

1. 在对应子目录创建 `ComponentName.vue`
2. 保存文件后，Vite 插件自动更新 `src/components.d.ts`
3. 在模板中直接使用 `<ComponentName />`，无需导入
