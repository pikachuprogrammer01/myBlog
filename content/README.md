# 内容管理

博客文章以 Markdown 格式编写，通过构建脚本编译为 JSON 数据供前端使用。

## 目录结构

```
content/
├── articles/       # Markdown 文章源文件（21 篇）
│   ├── hello-world.md
│   ├── vue3-composition-api.md
│   ├── element-plus-tutorial.md
│   ├── java-basic-questions-01.md
│   ├── java-basic-questions-02.md
│   ├── java-basic-questions-03.md
│   ├── java-keyword-summary.md
│   ├── generics-and-wildcards.md
│   ├── reflection.md
│   ├── serialization.md
│   ├── spi.md
│   ├── unsafe.md
│   ├── proxy.md
│   ├── syntactic-sugar.md
│   ├── why-there-only-value-passing-in-java.md
│   ├── how-sql-executed-in-mysql.md
│   ├── bigdecimal.md
│   ├── Ajax.md
│   ├── static-site-generation.md
│   ├── localstorage-web-app.md
│   └── rag-basis.md
└── assets/         # 文章内嵌图片（15 张 PNG）
```

## 文章格式

每篇文章使用 Markdown + YAML Front Matter 格式：

```markdown
---
id: "hello-world"
title: "Hello World — 我的第一篇博客"
date: "2024-01-15"
tags: ["博客", "Vue3"]
categories: ["前端"]
excerpt: "这是我的第一篇博客文章..."
cover: "/images/article-default.jpg"
published: true
---

## 正文开始

这里是 Markdown 内容...
```

### Front Matter 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | String | 推荐 | 文章唯一标识，不填则使用文件名 |
| `title` | String | 是 | 文章标题 |
| `date` | String | 是 | 发布日期（YYYY-MM-DD） |
| `tags` | Array | 否 | 标签列表 |
| `categories` | Array | 否 | 分类列表 |
| `excerpt` | String | 否 | 文章摘要，不填则自动截取正文前 100 字符 |
| `cover` | String | 否 | 封面图片路径 |
| `published` | Boolean | 否 | 是否发布（默认 true） |

### 文章内图片

文章中的图片引用使用相对路径：

```markdown
![图片描述](../assets/1714448200418.png)
```

构建时自动将 `../assets/` 路径替换为 `/images/`，并将图片复制到 `public/images/`。

## 构建流程

### 构建文章 JSON

```bash
npm run build:content
```

执行步骤：

1. 读取 `content/articles/*.md` 所有 Markdown 文件
2. 使用 `gray-matter` 解析 Front Matter
3. 处理文章内图片路径（`../assets/` → `/images/`）
4. 复制图片到 `public/images/`
5. 输出到 `src/data/articles.json`
6. 自动生成 `public/sitemap.xml`

### 构建 SQL 种子文件

```bash
npm run build:sql
```

将 Markdown 文章转换为 SQL INSERT 语句，输出到 `api/articles-seed.sql`，用于数据库初始化。

### 数据流转

```
content/articles/*.md   （Markdown 源文件）
        │
        ▼  npm run build:content
src/data/articles.json   （前端静态数据）
        │
        ▼  npm run build:sql
api/articles-seed.sql    （数据库种子）
        │
        ▼  Vercel API
MySQL 数据库 → API 响应 → 前端展示
```

## 新增文章

1. 在 `content/articles/` 创建 `your-article.md`
2. 填写 Front Matter（标题、日期、标签等）
3. 编写 Markdown 正文
4. 运行 `npm run build:content` 编译
5. 提交 `.md` 源文件和生成的 JSON

图片资源放入 `content/assets/`，构建时自动同步到 `public/images/`。

## 静态数据兜底

当后端 API 不可用时，前端使用 `src/data/articles.json` 作为静态数据兜底。这确保了即使数据库或 API 服务故障，博客仍可正常展示文章内容。
