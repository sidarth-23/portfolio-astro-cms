# Local Development Setup

The root `docker-compose.yml` contains the complete stack. For host-based development,
`task up` starts only MongoDB and MinIO; run Astro and Payload with Bun for fast HMR.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Bun](https://bun.sh/)
- [Task](https://taskfile.dev/) (optional)

## Quick Start

```bash
bun install
cp .env.example .env
cp .env.cms.example apps/cms/.env
cp .env.cms.example apps/web/.env
task up
bun run dev:all
```

`.env.example` configures the backing services. The app files contain the
runtime variables required by Payload; Astro also bridges its app-local
variables to the shared Payload configuration during development.

`task up` runs `mongodb`, `minio`, and the one-shot `minio-init` service. The
bucket is created idempotently.

## Compose Commands

```bash
task up                 # MongoDB, MinIO, and bucket bootstrap
task logs               # Follow all service logs
task status             # Show service status
task down               # Stop services
task clean              # Stop services, remove volumes and dependencies
```

Direct Compose usage:

```bash
docker compose up -d --build
docker compose down
```

## Access Services

| Service       | URL                         |
| ------------- | --------------------------- |
| Payload Admin | http://localhost:3000/admin |
| Astro Web     | http://localhost:4321       |
| MinIO Console | http://localhost:9001       |
| MongoDB       | localhost:27017             |

MongoDB and MinIO ports bind to localhost only. Payload accesses MinIO through the
internal Docker address `http://minio:9000`; MinIO is not a public media endpoint.

## Application Development

```bash
bun run dev:web
bun run dev:cms
bun run dev:all
bun run payload:types
```

## Database Tasks

```bash
task db:reset
task db:shell
task db:backup
task db:restore -- backups/payload-20260214.archive
```

For production deployment, see [`../production/overview.md`](../production/overview.md).
