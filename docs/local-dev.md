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

# Start all services
task up:build

# View all available commands
task --list
```

## 1. Environment Variables

Copy the example env file and fill in values if needed:

```bash
cp apps/cms/.env.example apps/cms/.env
```

The default values in `.env.example` are suitable for local development.

## 2. Start All Services

### Using Taskfile (Recommended)
```bash
task up:build   # Build and start all services in background
task logs       # Follow logs from all services
task logs:cms   # Follow CMS logs only
```

### Using Docker Compose directly
```bash
docker compose -f docker-compose.local.yml up --build
```

This will start:
- PostgreSQL (port 5432)
- MinIO (ports 9000, 9001)
- Payload CMS (port 3000)

## 3. Access Services

- **Payload Admin:** http://localhost:3000/admin
- **MinIO Console:** http://localhost:9001
- **Postgres:** localhost:5432 (user: postgres, password: postgres)

## 4. Stopping Services

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

## 5. Common Tasks

### Database Management
```bash
task db:reset     # Drop and recreate database
task db:shell     # Open psql shell
task db:backup    # Backup database to ./backups/
task db:restore   # Restore from backup
```

### Development Workflow
```bash
task cms:dev      # Run CMS locally (outside Docker)
task web:dev      # Run Astro web locally
task cms:types    # Generate Payload TypeScript types
```

### Health Checks
```bash
task status       # Show container status
task health       # Check service health endpoints
```

For a full list of available commands, run:
```bash
task --list
```

## 6. Notes
- Data is persisted in Docker volumes (`postgres_data`, `minio_data`).
- For custom development, you can run Bun commands inside the `payload-cms` container or locally if you have Bun installed.

---

For deployment, see the main Dokploy guide above.
