# Dokploy Setup

Deploy the complete stack as one Dokploy Docker Compose project using the repository's
root `docker-compose.yml`. Dokploy's native Traefik handles TLS, domains, redirects,
and WebSocket upgrades; no Nginx sidecar or deployment template is required.

## Prerequisites

- Dokploy installed on a VPS
- DNS A records for the CMS and web domains
- GitHub registry credentials with `read:packages` if pulling the CMS image

## 1. Create the Compose project

Create one **Docker Compose** service in a Dokploy project, select this repository, and
set the compose file path to `docker-compose.yml`. Configure a GHCR registry if using
the default `ghcr.io/sidarth-23/sidshub-cms:${IMAGE_TAG}` image. Dokploy can build the
CMS locally instead because the compose service also defines `apps/cms/Dockerfile`.

## 2. Configure environment

Copy `.env.example` into the project's environment configuration and replace all
placeholder values. Set:

- `PAYLOAD_SECRET` and `CMS_READ_TOKEN` to strong generated secrets.
- `PAYLOAD_PUBLIC_SERVER_URL` to the CMS public URL.
- `ASTRO_SITE_URL` to the web public URL.
- `ASTRO_CMS_API_URL` to the CMS public API URL plus `/api`.
- `ASTRO_CMS_READ_TOKEN` equal to `CMS_READ_TOKEN`.
- Email and S3 credentials required by the CMS.
- `IMAGE_TAG` to `latest`, a branch tag, or an immutable image tag.

Configure `WEB_DEPLOY_WEBHOOK_URL` and optional Dokploy cache-busting variables from
`.env.example` if publishing CMS content should rebuild the web image automatically.

## 3. Configure Traefik domains

In the project's Domains settings, route:

| Service       | Container port | Domain       |
| ------------- | -------------: | ------------ |
| `payload-cms` |           3000 | CMS hostname |
| `astro-web`   |           4321 | Web hostname |

MinIO and MongoDB receive no domains. Their Compose ports bind to `127.0.0.1`, and
MinIO remains private on the Docker network. Payload uses `http://minio:9000` directly.

## 4. First deployment

The web image is an Astro SSG build and requires seeded CMS content. Deploy in this
order:

1. Deploy `mongodb`, `minio`, `minio-init`, and `payload-cms`.
2. Open the CMS admin and create an administrator.
3. Seed home, projects, blog, CV, and site-settings content.
4. Build/redeploy `astro-web`.

The `minio-init` service waits for MinIO, creates `S3_BUCKET` idempotently, and applies
a private anonymous policy before the CMS starts.

## 5. Updates and rollback

For CMS updates, change `IMAGE_TAG` and redeploy `payload-cms`; use an immutable tag for
rollback. For web updates or content rebuilds, rebuild and redeploy `astro-web`:

```bash
docker compose build astro-web
docker compose up -d astro-web
```

If using the CMS publish webhook, Dokploy can trigger this redeploy automatically.
Scheduled media cleanup can run as a Dokploy job at `0 3 * * *` with:

```bash
bun run --filter @sidshub/cms cleanup:media
```
