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

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) builds the app, pushes a Docker image, and publishes an npm package to JFrog Fly on every push to `main`.

## Automated Fix Agent

When a GitHub issue is opened, a Flue agent (`.github/workflows/fix-issue.yml`) analyzes the issue, applies a fix, and opens a pull request automatically using the Mistral `mistral-medium-3.5` model.

### Setup

1. **Add `MISTRAL_API_KEY` as a repository secret** — Settings → Secrets and variables → Actions → New repository secret

2. **Allow GitHub Actions to create pull requests** — Settings → Actions → General → Workflow permissions → check "Allow GitHub Actions to create and approve pull requests"

3. **Ensure `jfrog/fly-action@v1` is configured** (already in the CI workflow) — this provides OIDC auth for Docker and npm publishing
