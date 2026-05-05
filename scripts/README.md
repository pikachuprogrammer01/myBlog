# 构建与工具脚本

项目根目录 `scripts/` 下的 Node.js 脚本，用于内容编译、数据库迁移和健康检查。

## 脚本列表

| 脚本 | 语言 | 命令 | 说明 |
|------|------|------|------|
| `build-content.js` | ESM | `npm run build:content` | Markdown → JSON 编译，含图片同步和 Sitemap 生成 |
| `articles-to-sql.cjs` | CJS | `npm run build:sql` | Markdown → SQL INSERT 转换，用于数据库初始化 |
| `check-health.js` | ESM | `npm run health-check` | 项目健康检查，验证关键文件完整性 |

---

## build-content.js

**用途**：将 `content/articles/*.md` 编译为 `src/data/articles.json`

### 执行流程

1. 读取 `content/articles/` 下所有 `.md` 文件
2. 使用 `gray-matter` 解析 YAML Front Matter
3. 自动替换文章内图片路径（`../assets/` → `/images/`）
4. 同步 `content/assets/` 图片到 `public/images/`
5. 输出 `src/data/articles.json`
6. 自动生成 `public/sitemap.xml`

### 配置

```js
const CONTENT_DIR = 'content/articles'
const ASSETS_DIR = 'content/assets'
const OUTPUT_FILE = 'src/data/articles.json'
const PUBLIC_ASSETS_DIR = 'public/images'
const SITE_URL = 'https://pikachuprogrammer01.github.io/myBlog'
```

### 文章处理

- Front Matter 解析失败时跳过该文件
- 未指定 `date` 时使用当前日期
- 未指定 `excerpt` 时自动截取正文前 100 个字符
- `published: false` 的文章不被过滤（由前端 `getAllArticles()` 过滤草稿）

---

## articles-to-sql.cjs

**用途**：将 Markdown 文章转换为 `api/articles-seed.sql`

### 功能

- 读取所有 `.md` 文章
- 自动生成 slug（中英文混合路径）
- 转义 SQL 特殊字符（单引号、反斜杠）
- 生成 INSERT 语句到 `api/articles-seed.sql`

### 生成的 SQL 包含

- `categories` 表插入（去重）
- `articles` 表插入（含分类关联）
- 时间戳使用 `NOW()` 或文章 Front Matter 日期

---

## check-health.js

**用途**：验证项目关键文件的完整性

### 检查项目

| 检查项 | 说明 |
|--------|------|
| 关键文件存在性 | `package.json`, `vite.config.js`, `src/main.js`, `src/router/index.js`, `src/stores/auth.js`, `src/data/articles.json` 等 |
| 静态资源完整性 | 轮播图片、文章默认封面 |
| 构建产物 | `dist/` 目录是否存在 |
| 配置文件 | `.env` 文件格式检查 |

### 输出示例

```
🔍 开始博客项目健康检查...

📁 检查关键文件是否存在:
  ✅ package.json
  ✅ vite.config.js
  ✅ src/main.js
  ...

📊 检查结果: 全部通过 ✅
```

## 使用方式

```bash
# 编写新文章后，编译文章数据
npm run build:content

# 需要更新数据库种子数据时
npm run build:sql

# 部署前或排查问题时
npm run health-check
```
