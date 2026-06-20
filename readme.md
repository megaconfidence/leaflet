# Leaflet

A simple blog with Astro, Hono, and SQLite.

## Features

- Username-only sign-in (no passwords)
- Create, edit, and publish blog posts (draft / published)
- Comment on published posts
- Manage all your posts from a dashboard

## Tech Stack

- **Frontend:** Astro (SSR)
- **Backend:** Hono (via Astro catch-all API route)
- **Database:** SQLite (better-sqlite3 + Drizzle ORM)
- **Auth:** Signed HMAC cookies

## Run with Docker

```bash
docker compose up --build -d
docker compose logs -f
```

Visit http://localhost:4321

Data is stored in a named Docker volume (`leaflet-data`) and will persist across container restarts.

## Environment Variables

| Variable          | Default                     | Description                          |
|-------------------|-----------------------------|--------------------------------------|
| `AUTH_SECRET`     | `leaflet-dev-secret...`     | HMAC secret for session signing      |
| `DATABASE_PATH`   | `/app/data/blog.db`         | SQLite file location                 |

**Important:** Change `AUTH_SECRET` in production.
