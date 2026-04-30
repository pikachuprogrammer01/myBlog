# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A full-stack personal blog with Vue 3 + Element Plus frontend and Node.js serverless API backend. User auth (JWT + bcrypt), comments (nested, soft-delete), likes, bookmarks, and contact form are all backed by a TiDB Cloud MySQL database via a Vercel-deployed API. Deployed to GitHub Pages (frontend) and Vercel (API).

## Commands

### Development
- `npm run dev` - Start Vite development server (port 5173)
- `npm run build` - Build for production (output to `dist/`)
- `npm run preview` - Preview production build locally

### Content & Quality
- `npm run build:content` - Build articles from Markdown (`content/articles/*.md`) to `src/data/articles.json`
- `npm run build:sql` - Generate SQL seed file (`api/articles-seed.sql`) from Markdown articles
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
- **Routing**: Vue Router 4.x (lazy-loaded routes, async navigation guards)
- **State**: Pinia 2.x (API-backed stores with JWT interceptor)
- **UI**: Element Plus 2.7 (full import in `main.js`) + ECharts 6
- **Markdown**: markdown-it + gray-matter (build-time), marked (runtime)
- **HTTP**: axios (API client with JWT auth interceptor)
- **Auth**: JWT (jsonwebtoken) + bcryptjs for password hashing
- **Testing**: Vitest 4 + jsdom + @vue/test-utils
- **Database**: TiDB Cloud MySQL (mysql2 driver with ssl)

### Frontend Layer (`src/`)
Follows Vue 3 conventions with Composables and Pinia stores:
- **API Client** (`src/api/client.js`) — Axios instance with JWT interceptor (auto-attach token, 401 redirect)
- **Composables** (`useAuth`, `useComments`, `useArticles`) wrap Pinia store logic
- **Stores** (Pinia: auth, comment, article) hold reactive state, backed by API calls
- **Router** has two guard levels: `meta.requiresAuth` (any logged-in user) and `meta.requiresAdmin` (admin role only), with async `restoreSession()` on navigation

### API Layer (`api/`)
Serverless function deployed to Vercel (`@vercel/node` runtime):
- **`api/index.js`** — Request router dispatching to route modules, CORS handling, body parsing
- **`api/db.js`** — MySQL connection pool (TiDB Cloud, env vars from `api/.env`, TLS enabled)
- **`api/middleware/auth.js`** — JWT sign/verify, `requireAuth` and `requireAdmin` guards
- **`api/routes/auth.js`** — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- **`api/routes/comments.js`** — Comment CRUD + sticky toggle + permanent delete
- **`api/routes/likes.js`** — Article/comment like toggle, bookmark toggle, user bookmarks
- **`api/routes/contact.js`** — Contact form submission + admin message list
- **`api/schema.sql`** — Full DDL (8 tables: users, categories, articles, comments, comment_likes, article_likes, bookmarks, contact_messages)
- **`api/seed.js`** — Seed script (initial users with bcrypt hashes + categories)
- CORS whitelist: GitHub Pages domain + localhost dev ports

#### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/profile` | Yes | Current user profile |
| GET | `/api/articles` | No | Paginated article list |
| GET | `/api/articles/:slug` | No | Article detail + view count |
| GET | `/api/categories` | No | Categories with counts |
| GET | `/api/categories/:slug/articles` | No | Articles by category |
| GET | `/api/articles/:slug/comments` | No | Article comments |
| POST | `/api/articles/:slug/comments` | Yes | Add comment |
| PUT | `/api/comments/:id` | Yes | Update comment (owner/admin) |
| DELETE | `/api/comments/:id` | Yes | Soft-delete comment |
| DELETE | `/api/comments/:id/permanent` | Admin | Permanently delete |
| PUT | `/api/comments/:id/sticky` | Admin | Toggle sticky |
| POST | `/api/articles/:slug/like` | Yes | Toggle article like |
| GET | `/api/articles/:slug/like` | No | Get like count |
| POST | `/api/comments/:id/like` | Yes | Toggle comment like |
| POST | `/api/articles/:slug/bookmark` | Yes | Toggle bookmark |
| GET | `/api/user/bookmarks` | Yes | User bookmarks |
| POST | `/api/contact` | No | Submit contact form |
| GET | `/api/contact` | Admin | List contact messages |
| PUT | `/api/contact/:id/read` | Admin | Mark message as read |

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
├── api/
│   └── client.js        # Axios instance + JWT interceptor
├── assets/styles/       # Global SCSS (main.scss)
├── components/
│   ├── admin/           # AdminChart, AdminStats, CommentManager, DataActions
│   ├── layout/          # AppLayout, Header, Footer
│   ├── blog/            # ArticleCard, CommentList, CommentForm, MarkdownRenderer
│   └── common/          # Carousel, BackToTop
├── composables/         # useAuth, useComments, useArticles
├── stores/              # Pinia: auth, comment, article (API-backed)
├── views/               # 14 page components (lazy-loaded)
├── constants/           # Storage keys, hardcoded users (deprecated)
├── utils/               # Date formatting, storage helpers
├── data/                # Generated article JSON (build output)
└── router/index.js      # Route definitions + async guards

api/
├── index.js             # Serverless API request router
├── db.js                # MySQL connection pool (TiDB Cloud, TLS)
├── schema.sql           # DDL for all 8 tables
├── seed.js              # Seed script (users + categories)
├── middleware/
│   └── auth.js          # JWT sign/verify + auth guards
├── routes/
│   ├── auth.js          # Register, login, profile
│   ├── comments.js      # Comment CRUD + sticky
│   ├── likes.js         # Like + bookmark toggle
│   └── contact.js       # Contact form + admin list
└── .env                 # Database credentials (do NOT commit)

content/
├── articles/*.md        # 21 Markdown article source files
└── assets/              # Article inline images

scripts/
├── build-content.js     # MD → JSON article compiler
└── check-health.js      # Project health checker
```

### Key Data Flows
- **Articles (API)**: TiDB Cloud → `api/index.js` → Frontend axios call → displayed in views
- **Articles (static)**: `content/articles/*.md` → `build:content` → `src/data/articles.json` → fallback when API unavailable
- **Comments**: User input → axios POST → API → MySQL → Pinia cache → reactive views
- **Auth**: Login/register → API → JWT token → localStorage → axios interceptor attaches to every request
- **Likes/Bookmarks**: Toggle button → axios POST → API → MySQL → optimistic UI update

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

### Security
- Passwords hashed with bcryptjs (10 salt rounds), never stored in plaintext
- JWT-based authentication (7-day expiry, secret from `JWT_SECRET` env var)
- Author-only + admin permission checks on comment edit/delete
- Admin-only endpoints for comment management and contact messages
- CORS restricted to explicit allowed origins
- MySQL connection over TLS with TiDB Cloud
- **API `.env` file contains real database credentials — never commit it**
- `src/constants/users.js` is deprecated; initial users are seeded via `api/seed.js`

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
