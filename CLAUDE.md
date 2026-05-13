# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

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
- **API Client** (`src/api/client.js`) — Axios instance with JWT interceptor
- **Composables** (`useAuth`, `useComments`, `useArticles`) wrap Pinia store logic
- **Stores** (Pinia: auth, comment, article) hold reactive state
- **Router** (`src/router/index.js`) — 16 routes, two guard levels: `meta.requiresAuth` and `meta.requiresAdmin`, with async `restoreSession()`

### API Layer (`api/`)
Serverless function deployed to Vercel (`@vercel/node` runtime):
- **`api/index.js`** — Router dispatching to route modules, CORS, body parsing
- **`api/db.js`** — MySQL connection pool (TiDB Cloud, env vars, TLS)
- **`api/middleware/auth.js`** — JWT sign/verify, `requireAuth`/`requireAdmin` guards
- **`api/routes/`** — auth, comments, likes, contact (full endpoint spec in source files)
- **`api/schema.sql`** — DDL (8 tables)
- **Full API spec**: see `api/routes/*.js` for all endpoints and auth requirements

### Deployment Topology
```
GitHub Pages (/myBlog/)  ←  Static frontend (Vite build)
Vercel (/api/*)          ←  Serverless API (Node.js)
TiDB Cloud               ←  MySQL-compatible database
```
`vercel.json` routes: `/api/(.*)` → API function, `/(.*)` → static `dist/`.

### Project Structure (key paths)
```
src/          — Vue 3 frontend (components, views, stores, composables, router)
api/          — Serverless API routes (auth, comments, likes, contact)
content/      — Markdown article source files (21 articles)
scripts/      — Build tools (build-content.js, check-health.js)
tests/        — Vitest tests (Carousel, auth store)
```

### Key Data Flows
- **Articles (API)**: TiDB Cloud → API → axios → views
- **Articles (static)**: `content/*.md` → `build:content` → `src/data/articles.json` (offline fallback)
- **Comments**: Form → axios → API → MySQL → Pinia cache → reactive views
- **Auth**: Login → API → JWT → localStorage → axios interceptor auto-attaches
- **Likes/Bookmarks**: Toggle → axios → API → MySQL → optimistic UI update

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
- `src/router/index.js` — All routes + navigation guards
- `src/constants/storage-keys.js` — localStorage key constants

### Core Logic
- `src/stores/auth.js` — Authentication state, login/logout/register actions
- `src/composables/useAuth.js` — Auth wrapper functions
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
