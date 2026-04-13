# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
A static personal blog built with Vue 3 + Element Plus, featuring 14 pages with simulated dynamic functionality (authentication, comments, admin panel) using client-side storage only. Deployed to GitHub Pages for technical demonstration.

## Commands

### Development
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production (output to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code checking
- `npm run format` - Format code with Prettier

### Content Management
- `npm run build:content` - Build articles from Markdown to JSON (reads from `content/articles/*.md`)

### Deployment
- `npm run deploy` - Build and deploy to GitHub Pages via `gh-pages` package

## Architecture

### Tech Stack
- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build**: Vite 5.x
- **Routing**: Vue Router 4.x
- **State**: Pinia 2.x
- **UI**: Element Plus (full import in `main.js`)
- **Markdown**: markdown-it + gray-matter (build-time processing)
- **Storage**: localStorage for simulated data

### Core Design Patterns
1. **Composition API**: Business logic in composables (`useAuth`, `useComments`, `useArticles`)
2. **Client-Side Simulation**:
   - Authentication: Hardcoded users (`src/constants/users.js`) + localStorage registration
   - Comments: localStorage persistence (`blog_comments` key)
   - Articles: Static JSON generated at build time
3. **Role-Based Access**:
   - `admin` role: Access to `/admin`, comment deletion
   - `user` role: Comment posting (when logged in)
4. **Static Site**: Built for GitHub Pages, no backend

### Project Structure
```
src/
├── assets/styles/   # Global SCSS styles (main.scss)
├── components/      # Reusable components
│   ├── layout/      # AppLayout, Header, Footer
│   ├── blog/        # ArticleCard, CommentList, MarkdownRenderer
│   └── common/      # Carousel, BackToTop
├── composables/     # useAuth, useComments, useArticles
├── stores/          # Pinia stores: auth, comment, article
├── views/           # 14 page components
├── constants/       # Storage keys, hardcoded users
├── utils/           # Date formatting, storage helpers
├── data/            # Generated article JSON
└── router/index.js  # Route definitions + guards
```

### Key Data Flow
- **Articles**: `content/articles/*.md` → `npm run build:content` → `src/data/articles.json` → Runtime load
- **Comments**: User input → Pinia store → localStorage (`blog_comments`)
- **Auth**: Login/register → Pinia store → localStorage token

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
- **Separation**: CSS must be in Vue SFC `<style>` blocks only
- **No inline styles**: No `style` attributes or `<style>` tags in templates
- **Preprocessor**: Sass/Scss (global styles in `src/assets/styles/main.scss`)
- **Naming**: BEM-like conventions with `.blog-` prefix

### JavaScript Animations (Minimum 2)
1. **Homepage Carousel** - Auto-rotate + manual controls (`Carousel.vue`)
2. **Back-to-Top Button** - Scroll-triggered visibility, smooth scroll (`BackToTop.vue`)

### Security & Limitations (Demo Only)
- ⚠️ **Not production-ready** - client-side simulation only
- Hardcoded credentials in `src/constants/users.js`
- No XSS/CSRF protection for comments
- Data isolated per browser (no sync across devices)

## Where to Look First

### Configuration Files
- `vite.config.js` - Build config, GitHub Pages base path (`/myBlog/`), `@` alias
- `src/router/index.js` - All 14 routes + navigation guards
- `src/constants/storage-keys.js` - localStorage key constants

### Core Logic
- `src/stores/auth.js` - Authentication state, login/logout/register
- `src/composables/useAuth.js` - Auth wrapper functions
- `src/constants/users.js` - Hardcoded demo users (admin/admin123, user1/user123, user2/user456)

### Key Components
- `src/components/layout/AppLayout.vue` - Main layout wrapper
- `src/components/common/Carousel.vue` - Homepage carousel (animation #1)
- `src/components/common/BackToTop.vue` - Scroll-to-top (animation #2)
- `src/components/blog/MarkdownRenderer.vue` - Article content display

## Development Notes

### Element Plus Integration
- Full import in `main.js` with all icons registered globally
- Styles imported from `element-plus/dist/index.css`

### Build & Deployment
- Base path: `/myBlog/` in production (configured in `vite.config.js`)
- Deploy via `npm run deploy` (builds + pushes to gh-pages branch)

### Code Quality
- ESLint with Vue 3 recommended rules
- Component naming: PascalCase (.vue files)
- CSS class naming: kebab-case with `.blog-` prefix

## Icon and Asset Usage Policy

### Strict Prohibition
**NEVER** invent, create, or fabricate fictional:
- Icons
- Image URLs or paths
- Visual assets
- UI component names
- Library/framework features

### Mandatory Research Protocol

**BEFORE** including any visual element or uncertain content:

1. **SEARCH FIRST**
   - Verify existence of icons in official documentation
   - Confirm correct syntax and usage patterns
   - Check for deprecated or removed features

2. **USE TRUSTED SOURCES**
   - Official documentation (primary source)
   - Established design systems
   - Verified public repositories
   - Authoritative community resources

3. **UNCERTAIN? SEARCH THEN ASK**
   If you're not 100% certain about:
   - Icon availability
   - API endpoint existence
   - Framework feature support
   - Library version compatibility
   
   **Procedure:**
   - Pause coding
   - Search for official documentation
   - Verify information from multiple sources
   - Only proceed when confident

### Code Examples

**Unacceptable (fabricated content):**
```javascript
// ❌ DON'T: Inventing non-existent features
import { fakeIcon } from 'non-existent-library';