# HAL-TEST Agent Instructions

## Repository Overview
Visual browser automation framework (Playwright + React Flow). Monorepo: Turbo + pnpm workspaces.

## Key Commands

### Development
```bash
pnpm dev                    # Start all apps (backend:2001, frontend:3000)
pnpm dev:backend            # Backend only
pnpm dev:frontend           # Frontend only
```

### Build & Test
```bash
pnpm build                  # Build all packages
pnpm test                   # Run all tests (vitest)
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Prettier format
```

### Database (backend)
```bash
pnpm --filter @halt-test/backend db:init
pnpm --filter @halt-test/backend db:migrate
```

### Playwright Browsers (required for backend)
```bash
pnpm --filter @halt-test/backend exec playwright install --with-deps chromium firefox webkit
```

### Cleanup
```bash
pnpm run stop               # Kill ports 2001, 3000
pnpm clean                  # Clean all node_modules + turbo cache
```

## Architecture
| App | Stack | Port |
|-----|-------|------|
| `apps/backend` | Express + Playwright + SQLite/PostgreSQL | 2001 |
| `apps/frontend` | React 19 + Vite + React Flow + Tailwind v4 | 3000 (dev) / 5173 (preview) |
| `apps/cli` | Published npm package `haltest` | — |
| `apps/web` / `apps/blog` | Additional frontend apps | — |

## Testing
- **Unit/Integration**: `vitest` (backend + frontend)
- **E2E**: Playwright (`pnpm --filter @halt-test/backend test:e2e`)
- **Pre-push hook**: `turbo run test --affected`

## Linting & Formatting
- **Pre-commit**: `lint-staged` (Prettier + ESLint --fix)
- Root `package.json` defines lint-staged for `apps/**/*.{js,jsx,ts,tsx,json,css,md}`

## Common Gotchas
1. **Playwright browsers not installed by `pnpm install`** — must run `playwright install --with-deps` manually or via postinstall
2. **Node ≥ 20 required** (engines field in all packages)
3. **Guest mode for local dev**: set `AUTH_ENABLED=false` and `VITE_AUTH_ENABLED=false` in `.env`
4. **Turbo caches build outputs** in `.turbo/cache/` — use `pnpm clean` to fully reset
5. **Port conflicts** — backend (2001) and frontend (3000/5173) — use `pnpm run stop` to clear

## "Open URL" Node / Cloudflare Issues
The backend uses Playwright for browser automation. If "open url" fails:
- Check `curl http://localhost:2001/api/doctor` for browser/OS compatibility
- Cloudflare challenges often require: stealth plugins, proper headers, or residential proxies
- Playwright's `page.goto()` with `waitUntil: 'networkidle'` may hang on challenge pages
- Consider `playwright-stealth` or `puppeteer-extra-plugin-stealth` if scraping protected sites

## Environment Files
- **Backend**: `apps/backend/.env` (see `.env.example` if exists)
- **Frontend**: `apps/frontend/.env` (VITE_* vars)
- **CLI**: loads root `.env` via dotenv