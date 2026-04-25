# Local Development Setup

This guide covers running all required services locally using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Bun](https://bun.sh/)
- [Task](https://taskfile.dev/) (optional, for easier workflow management)

## Quick Start with Taskfile

```bash
task install    # Install dependencies
task up:build   # Start local infrastructure
task --list     # View all available commands
```

## 1. Environment Variables

Copy the example env file and fill in values if needed:

```bash
cp .env.cms.example apps/cms/.env
```

Most defaults in `.env.cms.example` are suitable for local development, except
email values. For auth emails, set these before starting the CMS:

- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

## 2. Start Local Infrastructure

### Using Taskfile (Recommended)

```bash
task up:build         # Build and start MongoDB and MinIO in background
task logs             # Follow all logs
task logs:mongodb
task logs:minio
```

### Using Docker Compose directly

```bash
docker compose -f docker-compose.local.yml up --build
```

This starts MongoDB (port 27017) and MinIO (ports 9000, 9001). Taskfile also
runs `minio:ensure-bucket` to create `S3_BUCKET` idempotently.

If S3 environment variables are omitted entirely, the CMS starts and uses
Payload's default local upload storage instead of MinIO.

## 3. Start App Dev Servers

Run app servers on the host so workspace package rebuilds trigger fast HMR:

```bash
bun run dev:web   # Astro web + direct web package watchers
bun run dev:cms   # Payload/Next CMS + CMS package watchers
bun run dev:all   # Web, CMS, and all selected package watchers
```

## 4. Access Services

| Service       | URL                         |
| ------------- | --------------------------- |
| Payload Admin | http://localhost:3000/admin |
| Astro Web     | http://localhost:4321       |
| MinIO Console | http://localhost:9001       |
| MongoDB       | localhost:27017             |

## 5. Stopping Services

```bash
task down       # Stop all services
task restart    # Restart all services
task clean      # Stop and remove volumes (deletes data!)

# or directly:
docker compose -f docker-compose.local.yml down
```

## 6. Common Tasks

### Database Management

```bash
task db:reset     # Drop and recreate database
task db:shell     # Open database shell
task db:backup    # Backup database to ./backups/
task db:restore   # Restore from backup
```

### Development Workflow

```bash
bun run dev:web       # Run Astro with package watchers
bun run dev:cms       # Run CMS with package watchers
bun run dev:all       # Run both apps with package watchers
bun run payload:types # Generate Payload TypeScript types
```

### Web Build Requirement

`bun run build:web` requires Payload CMS to be running and reachable. It checks
`ASTRO_CMS_API_URL` (default `http://localhost:3000/api`) via `/health` with
bearer token auth before the Astro build starts. If the CMS is down,
unauthorized, or unhealthy, the build fails immediately.

### Service Status

```bash
task status       # Show container status
task --list       # Full list of available commands
```

## 7. Notes

- Data is persisted in Docker volumes (`mongodb_data`, `minio_data`).
- Local bucket provisioning is automatic when using `task up` or `task up:build`.

---

For production deployment, see [`../production/overview.md`](../production/overview.md).
