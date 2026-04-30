# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A personal blog built with Vue 3 + Element Plus, featuring 14 pages with simulated dynamic functionality (authentication, comments, admin panel) using client-side storage. Backed by a serverless API (Vercel Node.js) connected to a TiDB Cloud MySQL database for articles and categories. Deployed to GitHub Pages (frontend) and Vercel (API).

## Commands

### Development
- `npm run dev` - Start Vite development server (port 5173)
- `npm run build` - Build for production (output to `dist/`)
- `npm run preview` - Preview production build locally

### Content & Quality
- `npm run build:content` - Build articles from Markdown (`content/articles/*.md`) to `src/data/articles.json`
- `npm run lint` - Run ESLint code checking
- `npm run format` - Format code with Prettier

### Testing
- `npm run test` - Run Vitest test suite (jsdom environment)
- `npx vitest run --coverage` - Run tests with coverage report (text/json/html output to `coverage/`)

### Health & Deployment
- `npm run health-check` - Check that critical files, scripts, and assets exist
- `npm run deploy` - Build and deploy frontend to GitHub Pages via `gh-pages`
- API deploys automatically to Vercel on git push (configured in `vercel.json`)

## Architecture

### Tech Stack
- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build**: Vite 5.x
- **Routing**: Vue Router 4.x (lazy-loaded routes, navigation guards)
- **State**: Pinia 2.x
- **UI**: Element Plus 2.7 (full import in `main.js`) + ECharts 6
- **Markdown**: markdown-it + gray-matter (build-time), marked (runtime)
- **HTTP**: axios (API calls from frontend)
- **Testing**: Vitest 4 + jsdom + @vue/test-utils
- **Storage**: localStorage for simulated auth/comments; MySQL for articles

### Frontend Layer (`src/`)
Follows Vue 3 conventions with Composables and Pinia stores:
- **Composables** (`useAuth`, `useComments`, `useArticles`) wrap business logic
- **Stores** (Pinia: auth, comment, article) hold reactive state, synced to localStorage
- **Router** has two guard levels: `meta.requiresAuth` (any logged-in user) and `meta.requiresAdmin` (admin role only)

### API Layer (`api/`)
Serverless function deployed to Vercel (`@vercel/node` runtime):
- **`api/index.js`** — Express-style request handler with CORS, routing, and MySQL queries
  - `GET /api/articles` — Paginated article list (published only, with categories)
  - `GET /api/articles/:slug` — Single article detail + increments view count
  - `GET /api/categories` — All categories with article counts
  - `GET /api/categories/:slug/articles` — Articles by category
- **`api/db.js`** — MySQL connection pool (TiDB Cloud, env vars from `api/.env`)
- CORS whitelist: GitHub Pages domain + localhost dev ports

### Deployment Topology
```
GitHub Pages (/myBlog/)  ←  Static frontend (Vite build)
Vercel (/api/*)          ←  Serverless API (Node.js)
TiDB Cloud               ←  MySQL-compatible database
```

`vercel.json` routes: `/api/(.*)` → API function, `/(.*)` → static `dist/`.

### Project Structure
```
src/
├── assets/styles/   # Global SCSS (main.scss)
├── components/
│   ├── layout/      # AppLayout, Header, Footer
│   ├── blog/        # ArticleCard, CommentList, MarkdownRenderer
│   └── common/      # Carousel, BackToTop
├── composables/     # useAuth, useComments, useArticles
├── stores/          # Pinia: auth, comment, article
├── views/           # 14 page components (lazy-loaded)
├── constants/       # Storage keys, hardcoded users
├── utils/           # Date formatting, storage helpers
├── data/            # Generated article JSON (build output)
└── router/index.js  # Route definitions + guards

api/
├── index.js         # Serverless API handler
├── db.js            # MySQL connection pool
└── .env             # Database credentials (do NOT commit)

content/
├── articles/*.md    # 21 Markdown article source files
└── assets/          # Article inline images

scripts/
├── build-content.js # MD → JSON article compiler
└── check-health.js  # Project health checker
```

### Key Data Flows
- **Articles (API)**: TiDB Cloud → `api/index.js` → Frontend axios call → displayed in views
- **Articles (static)**: `content/articles/*.md` → `build:content` → `src/data/articles.json` → fallback/offline data
- **Comments**: User input → Pinia store → localStorage (`blog_comments`)
- **Auth**: Login/register → Pinia store → localStorage token (hardcoded users + localStorage registrations)

### Routing (14 Pages)
| Path | Component | Auth Required |
|------|-----------|---------------|
| `/` | Home | No |
| `/about` | About | No |
| `/article/:id` | Article | No |
| `/tools` | Tools | No |
| `/contact` | Contact | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/profile` | Profile | Yes |
| `/tags` | Tags | No |
| `/categories` | Categories | No |
| `/search` | Search | No |
| `/archive` | Archive | No |
| `/admin` | Admin | Admin only |
| `/*` | NotFound | No |

## Important Constraints

### CSS Requirements
- CSS must be in Vue SFC `<style>` blocks only — no inline `style` attributes or `<style>` tags in templates
- Sass/Scss preprocessor (global styles in `src/assets/styles/main.scss`)
- `.blog-` prefix convention with BEM-like naming

### JavaScript Animations (Minimum 2)
1. **Homepage Carousel** (`Carousel.vue`) — Auto-rotate + manual controls
2. **Back-to-Top Button** (`BackToTop.vue`) — Scroll-triggered visibility, smooth scroll

### Security & Limitations (Demo Only)
- Not production-ready — auth and comments are client-side simulation only
- Hardcoded credentials in `src/constants/users.js` (admin/admin123, user1/user123, user2/user456)
- No XSS/CSRF protection for comments
- Data isolated per browser (localStorage, no cross-device sync)
- **API `.env` file contains real database credentials — never commit it**

## Testing

### Configuration
- **Vitest** with jsdom environment, globals enabled
- Config: `vitest.config.js` (mirrors Vite's `@` alias)
- Setup file: `tests/setup.js`
- Coverage via v8 provider, outputs text/json/html to `coverage/`

### Test Files
- `src/components/__tests__/Carousel.test.js` — Carousel component tests
- `src/stores/__tests__/auth.test.js` — Auth store tests (login, logout, register, guards)

## Where to Look First

### Configuration
- `vite.config.js` — Build config, GitHub Pages base path (`/myBlog/`), `@` alias, SCSS settings
- `vercel.json` — Vercel deployment: API + static build routing
- `vitest.config.js` — Test environment and coverage config
- `src/router/index.js` — All 14 routes + navigation guards
- `src/constants/storage-keys.js` — localStorage key constants

### Core Logic
- `src/stores/auth.js` — Authentication state, login/logout/register actions
- `src/composables/useAuth.js` — Auth wrapper functions
- `src/constants/users.js` — Hardcoded demo users
- `api/index.js` — Serverless API with article/category endpoints

### Key Components
- `src/components/layout/AppLayout.vue` — Main layout wrapper
- `src/components/common/Carousel.vue` — Homepage carousel (animation #1)
- `src/components/common/BackToTop.vue` — Scroll-to-top (animation #2)
- `src/components/blog/MarkdownRenderer.vue` — Article content display

### Development Notes
- Element Plus is fully imported with all icons registered globally in `main.js`
- Production base path is `/myBlog/` (GitHub Pages); dev is `/`
- CORS in `api/index.js` must be updated if deploying to a different domain
- Articles can come from either the MySQL API or the static JSON build — the static build serves as offline fallback
