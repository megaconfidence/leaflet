# 🍃 Leaflet

A simple blog app built with Astro, Hono, and SQLite. Username-only auth, draft/publish workflows, and comments.

**Live:** [leaflet.conflare.workers.dev](https://leaflet.conflare.workers.dev/)

## Features

- Username-only sign-in (no passwords)
- Create, edit, publish, and delete blog posts
- Draft and published states
- Comment on published posts
- Dashboard for managing posts

## Tech Stack

- **Frontend:** Astro (SSR) with Hono API routes
- **Database:** SQLite via better-sqlite3 + Drizzle ORM
- **Auth:** HMAC-signed cookies
- **Registry:** JFrog Fly (npm + Docker)
- **Deploy:** Cloudflare Containers (Worker proxy → containerized Node server)
- **CI/CD:** GitHub Actions with JFrog Fly OIDC auth

## Quick Start

### Prerequisites

1. Install the [Fly App](https://fly.jfrog.ai) and enable npm
2. Export your Fly access token:

```bash
export FLY_ACCESS_TOKEN=<your-token>
```

Add this to your shell profile so it persists. You can find the token in `~/.npmrc` or via the Fly App.

### Local Development

```bash
cp .env.example .env
npm install
npm run dev
```

Visit http://localhost:4321

### Run with Docker

```bash
docker compose up --build -d
```

Data persists in a named Docker volume (`leaflet-data`).

## Environment Variables

| Variable           | Required | Default                 | Description                                |
| ------------------ | -------- | ----------------------- | ------------------------------------------ |
| `FLY_ACCESS_TOKEN` | Yes      | —                       | JFrog Fly access token (npm registry auth) |
| `AUTH_SECRET`      | No       | `leaflet-dev-secret...` | HMAC secret for session signing            |
| `DATABASE_PATH`    | No       | `/app/data/blog.db`     | SQLite file location                       |
| `MISTRAL_API_KEY`  | No       | —                       | Mistral API key (for Flue agents in CI)    |

See [`.env.example`](.env.example) for a template.

## CI/CD

Push to `main` triggers the CI workflow (`.github/workflows/ci.yml`):

1. **Install & build** — `npm install` + `npm run build` (deps resolved from Fly registry via OIDC auth)
2. **Docker push** — builds and pushes image to Fly Docker registry (tagged with git SHA)
3. **npm publish** — publishes the package to Fly npm registry

Pull requests run install + build only (no push/publish).

All CI workflows use `jfrog/fly-action@v1` for passwordless OIDC auth. No long-lived secrets for registry access.

## Auto Versioning

A Husky post-commit hook runs `npm version patch --no-git-tag-version` after every local commit, bumping the patch version in `package.json` automatically. Skipped in CI (`$CI` env var) to avoid interfering with agent workflows.

## Cloudflare Containers

The app deploys to Cloudflare Containers via a thin Worker (`src/worker.ts`) that proxies all requests to the containerized Astro server.

**Deploy:** Connect the repo to Cloudflare via the dashboard. Set `FLY_ACCESS_TOKEN` as a build environment variable so `npm install` can authenticate with the Fly registry during the build.

**Note:** SQLite data is ephemeral on Cloudflare. For persistent storage, consider migrating to Cloudflare D1 or an external database.

## AI Agents

Two Flue agents (Mistral `mistral-medium-3.5`) automate development:

### Fix Issue Agent (`fix-issue.yml`)

Triggers when a GitHub issue is opened. The agent:

1. Reads the issue with `gh issue view`
2. Explores the codebase to understand the affected area
3. Diagnoses the root cause
4. Creates a `fix/issue-<number>` branch and applies a minimal fix
5. Verifies the fix compiles with `npm run build`
6. Bumps the patch version via `npm version patch`
7. Commits with a Conventional Commit message (e.g. `fix: resolve #42 — null pointer in post editor`)
8. Opens a pull request with diagnosis, changes, and `Closes #<number>`

Guardrails prevent retry loops and rate limit exhaustion: no repeated commands, no retry on `gh pr create` failure.

### PR Review Agent (`review-pr.yml`)

Triggers on `pull_request: [opened, synchronize, reopened]`. The agent:

1. Fetches PR metadata and diff with `gh pr view` and `gh pr diff`
2. Runs `npm run build` to check for compilation errors
3. Reviews the diff across six categories:
   - **Issue reference** — notes if `Closes #N` / `Fixes #N` is present (informational, not blocking)
   - **Code quality** — compilation errors, unused imports, debug statements, convention adherence, [Conventional Commits](https://www.conventionalcommits.org/) compliance
   - **Correctness** — does the PR address the issue, edge cases, potential bugs
   - **Security** — committed secrets, SQL injection, XSS, dangerous patterns
   - **Scope** — minimal/focused diff, no unrelated changes, no committed build artifacts
   - **Documentation** — PR description quality, README updates where needed
4. Checks for a version bump in `package.json` — if missing, runs `npm version patch`, commits with `chore: bump version`, and pushes to the PR branch
5. Posts a review via `gh pr review` with verdict (`approve`, `request_changes`, or `comment`) and detailed findings

### Setup

1. Add `MISTRAL_API_KEY` as a repository secret
2. Enable "Allow GitHub Actions to create and approve pull requests" in repo settings
3. Both agents use `jfrog/fly-action@v1` for npm registry auth
