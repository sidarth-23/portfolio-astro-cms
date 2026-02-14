# Sid's Hub Workspace

Monorepo workspace for:
- `apps/web`: Astro portfolio frontend
- `apps/cms`: Payload CMS backend

## Quick Start

```bash
# Install dependencies
bun install

# Start local services (Postgres, MinIO, Payload CMS)
task up:build

# Or use Docker Compose directly
docker compose -f docker-compose.local.yml up --build
```

See all available commands: `task --list`

## Local Development

See [docs/local-dev.md](docs/local-dev.md) for a clean local setup of Payload CMS and all required services.

## Build Contract

- `bun run build:web` requires a reachable CMS at `ASTRO_CMS_API_URL` (default `http://localhost:3000/api`).
- The web build runs a CMS preflight check and fails immediately if CMS is unreachable or unhealthy.
- `task cms:types` only generates TypeScript types; it does not make web builds work without a live CMS.

## Taskfile Commands

Common development tasks (requires [Task](https://taskfile.dev/)):

- `task up` / `task down` - Start/stop services
- `task db:reset` - Reset database
- `task cms:types` - Generate Payload types
- `task web:dev` - Run Astro dev server
- `task logs:cms` - View CMS logs
- `task health` - Check service health
