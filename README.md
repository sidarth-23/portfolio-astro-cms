# Sid's Hub Workspace

Public monorepo for [sidshub.in](https://www.sidshub.in), containing:

- `apps/web`: Astro portfolio and blog frontend
- `apps/cms`: Payload CMS backend
- `packages/cms-core`: shared CMS config and generated types
- `packages/cms-editor`: Lexical rich text editor integration (CMS + web)

## Tech Stack

- Bun workspaces
- Astro 5 + TypeScript (strict)
- Tailwind CSS v4 + DaisyUI v5
- Payload CMS + MongoDB + MinIO (S3-compatible storage)

## Prerequisites

- [Bun](https://bun.sh/)
- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [Task](https://taskfile.dev/) (optional, but recommended)

## Quick Start

```bash
# 1) Install dependencies
bun install

# 2) Create env files
cp .env.cms.example apps/cms/.env
cp .env.web.example apps/web/.env

# 3) Start local infrastructure and CMS
task up:build
# or: docker compose -f docker-compose.local.yml up -d --build

# 4) Start web app
bun run dev:web
```

### Local URLs

- Web: `http://localhost:4321`
- Payload Admin: `http://localhost:3000/admin`
- MinIO Console: `http://localhost:9001`

## Workspace Commands

```bash
bun run dev           # Alias to dev:web
bun run dev:web       # Astro web dev server
bun run dev:cms       # Payload CMS dev server
bun run build         # Build web + cms
bun run build:web     # Build web only
bun run build:cms     # Build cms only
bun run check:web     # Astro type checks
bun run payload:types # Regenerate Payload types
```

## Git Hooks

Git hooks are installed automatically on `bun install` using `simple-git-hooks`.

- `pre-commit`: runs `lint-staged` on staged files only.
- `commit-msg`: validates commit messages using Conventional Commits.

### What Pre-commit Enforces

- For staged `*.{js,jsx,ts,tsx,cjs,mjs,astro}` files:
  - `eslint --fix --max-warnings=0`
  - `prettier --write`
- For staged `*.{json,md,mdx,yaml,yml,css,scss,html}` files:
  - `prettier --write`

`lint-staged` re-stages any files that are auto-fixed, so the formatted code is what gets committed.

### Commit Message Format

Commit messages must follow Conventional Commits, for example:

- `feat(web): add OG image cleanup toggle`
- `fix(cms): handle empty deployment status`
- `chore: update eslint config`

### Manual Commands

If you need to run the same checks manually:

```bash
bun run precommit
bun run commitlint --edit .git/COMMIT_EDITMSG
```

## Taskfile Commands

```bash
task up               # Start local services
task up:build         # Build and start local services
task down             # Stop local services
task logs             # Follow all service logs
task logs:cms         # Follow CMS logs
task db:reset         # Reset local database
task db:backup        # Backup local database
task db:restore       # Restore local database backup
task format           # Format web/cms source files
```

Run `task --list` for the complete list.

## Build Contract

- `bun run build:web` requires a reachable CMS at `ASTRO_CMS_API_URL` (default: `http://localhost:3000/api`).
- Web build runs a CMS preflight check with bearer token auth and fails fast when CMS is unreachable or unauthorized.
- Regenerate shared Payload types with `bun run payload:types`.

## Docs

- Local setup guide: `docs/local-dev.md`
- Web app details: `apps/web/README.md`
- CMS details: `apps/cms/README.md`

## Notes for Public Contributions

- Never commit `.env` files, credentials, or tokens.
- Keep changes scoped to the relevant app/package.
- Run the relevant build/check commands before opening a PR.
