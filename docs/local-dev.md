# Local Development Setup for Payload CMS

This guide helps you run all required services for Payload CMS locally using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Bun](https://bun.sh/) (for local dev outside Docker, optional)
- [Task](https://taskfile.dev/) (optional, for easier workflow management)

## Quick Start with Taskfile

If you have [Task](https://taskfile.dev/) installed:

```bash
# Install dependencies
task install

# Start local infrastructure
task up:build

# View all available commands
task --list
```

## 1. Environment Variables

Copy the example env file and fill in values if needed:

```bash
cp .env.cms.example apps/cms/.env
```

Most defaults in `.env.cms.example` are suitable for local development, except email values.

For auth emails, set these before starting CMS:

- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

## 2. Start Local Infrastructure

### Using Taskfile (Recommended)

```bash
task up:build   # Build and start MongoDB and MinIO in background
task logs       # Follow logs from local infrastructure
task logs:mongodb
task logs:minio
```

### Using Docker Compose directly

```bash
docker compose -f docker-compose.local.yml up --build
```

This will start:

- MongoDB (port 27017)
- MinIO (ports 9000, 9001)

Taskfile local startup also runs `minio:ensure-bucket`, which uses `minio-init` to create `S3_BUCKET` idempotently.
If you omit the S3 environment variables entirely, the CMS still starts and uses Payload's default local upload storage instead of MinIO.

## 3. Start App Dev Servers

Run app servers on the host so workspace package rebuilds trigger fast HMR/recompilation:

```bash
bun run dev:web   # Astro web + direct web package watchers
bun run dev:cms   # Payload/Next CMS + CMS package watchers
bun run dev:all   # Web, CMS, and all selected package watchers
```

## 4. Access Services

- **Payload Admin:** http://localhost:3000/admin
- **Astro Web:** http://localhost:4321
- **MinIO Console:** http://localhost:9001
- **MongoDB:** localhost:27017

## 5. Stopping Services

### Using Taskfile

```bash
task down       # Stop all services
task restart    # Restart all services
task clean      # Stop and remove volumes (deletes data!)
```

### Using Docker Compose directly

```bash
docker compose -f docker-compose.local.yml down
```

## 6. Common Tasks

### Database Management

```bash
task db:reset     # Drop and recreate database
task db:shell     # Open database shell
task db:backup    # Backup database to ./backups/ (if configured)
task db:restore   # Restore from backup (if configured)
```

### Development Workflow

```bash
bun run dev:web       # Run Astro locally with package watchers
bun run dev:cms       # Run CMS locally with package watchers
bun run dev:all       # Run both apps locally with package watchers
bun run payload:types # Generate Payload TypeScript types
```

### Web Build Requirement

- `bun run build:web` (or `task web:build`) requires Payload CMS to be running and reachable.
- Build preflight checks `ASTRO_CMS_API_URL` (default `http://localhost:3000/api`) via `/health` with bearer token auth before Astro build starts.
- If CMS is down, unauthorized, timing out, or unhealthy, the web build fails immediately.

### Service Status

```bash
task status       # Show container status
```

For a full list of available commands, run:

```bash
task --list
```

## 7. Notes

- Data is persisted in Docker volumes (`mongodb_data`, `minio_data`).
- Local bucket provisioning is automatic when using `task up` or `task up:build`.
- For custom development, you can run Bun commands inside the `payload-cms` container or locally if you have Bun installed.

---

For deployment, see `docs/deployment.md`.
