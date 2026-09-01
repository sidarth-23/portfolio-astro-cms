# Dokploy Setup

Deploy the complete stack as one Dokploy Docker Compose project using the repository's
root `docker-compose.yml`. Dokploy's native Traefik handles TLS, domains, redirects,
and WebSocket upgrades; no Nginx sidecar or deployment template is required.

## Prerequisites

- Dokploy installed on a VPS
- DNS A record for the shared web/CMS hostname
- GitHub registry credentials with `read:packages` if pulling the CMS image

## 1. Create the Compose project

Create one **Docker Compose** service in a Dokploy project, select this repository, and
set the compose file path to `docker-compose.yml`. Configure a GHCR registry if using
the default `ghcr.io/sidarth-23/sidshub-cms:${IMAGE_TAG}` image. Dokploy can build the
CMS locally instead because the compose service also defines `apps/cms/Dockerfile`.
All services start together in the single Compose project; no Compose profile is required.

## 2. Configure environment

Copy `.env.example` into the project's environment configuration and replace all
placeholder values. Set:

- `PAYLOAD_SECRET` to a strong generated secret.
- `PAYLOAD_PUBLIC_SERVER_URL` to the shared public URL.
- `ASTRO_SITE_URL` to the shared public URL.
- `ASTRO_CMS_API_URL` to the shared public URL plus `/api`.
- Email and S3 credentials required by the CMS.
- `IMAGE_TAG` to `latest`, a branch tag, or an immutable image tag.

Configure `WEB_DEPLOY_WEBHOOK_URL` and optional Dokploy cache-busting variables from
`.env.example` if publishing CMS content should rebuild the web image automatically.

## 3. Configure Traefik domains

In the project's Domains settings, add three routes using the same hostname:

| Path     | Service       | Container port | Internal path | Strip path |
| -------- | ------------- | -------------: | ------------- | ---------- |
| `/`      | `astro-web`   |           4321 | `/`           | Disabled   |
| `/admin` | `payload-cms` |           3000 | `/admin`      | Disabled   |
| `/api`   | `payload-cms` |           3000 | `/api`        | Disabled   |

The `/admin` and `/api` routes must take precedence over the `/` route. Dokploy
normally assigns higher priority to the more specific path routes.

MinIO and MongoDB receive no domains. Their Compose ports bind to `127.0.0.1`, and
MinIO remains private on the Docker network. Payload uses `http://minio:9000` directly.

## 4. First deployment

The unified project builds and starts all services together:

```bash
docker compose up -d --build
```

Open the CMS admin and seed home, projects, blog, CV, and site-settings content as needed.

The `minio-init` service waits for MinIO, creates `S3_BUCKET` idempotently, and applies
a private anonymous policy before the CMS starts.

## 5. Updates and rollback

For CMS updates, change `IMAGE_TAG` and redeploy `payload-cms`; use an immutable tag for
rollback. For web updates or content rebuilds, rebuild and redeploy `astro-web`:

```bash
docker compose up -d --build
```

If using the CMS publish webhook, Dokploy can trigger this redeploy automatically.
Scheduled media cleanup can run as a Dokploy job at `0 3 * * *` with:

```bash
bun run --filter @sidshub/cms cleanup:media
```
