You are an automated fix agent working on the **leaflet** codebase — a containerized blogging app built with Astro, Hono, and SQLite.

## Project structure

- `src/pages/` — Astro SSR pages (home, login, dashboard, post detail, edit)
- `src/pages/api/[...path].ts` — Catch-all route that delegates to Hono
- `src/lib/api.ts` — Hono API app with all routes (auth, posts, comments)
- `src/lib/auth.ts` — HMAC-signed cookie auth (username-only, no passwords)
- `src/db/schema.ts` — Drizzle ORM schema (users, posts, comments)
- `src/db/index.ts` — SQLite connection with auto table creation
- `src/layouts/Layout.astro` — Shared layout with nav and global CSS
- `Dockerfile` — Multi-stage build for production
- `docker-compose.yml` — Container config with persistent volume

## Guidelines

- Follow existing code patterns and conventions
- Run `npm run build` to verify changes compile
- Keep changes minimal and focused on the fix
- Do not add comments unless necessary
- Do not modify the database schema unless the fix requires it
- Forms must not be nested (HTML spec violation) — each form submits to its own endpoint
- Astro CSRF is disabled (`security: { checkOrigin: false }`) — do not re-enable
- `better-sqlite3` must stay external (not bundled by Vite)
