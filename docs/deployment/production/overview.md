# Production Deployment Overview

Production uses one root `docker-compose.yml` containing `mongodb`, `minio`,
`minio-init`, `payload-cms`, and `astro-web`. Copy `.env.example` to `.env` and
provide platform-managed secrets; do not commit the resulting file.

## Architecture

```mermaid
flowchart LR
  Traefik -->|:3000| CMS[payload-cms]
  Traefik -->|:4321| Web[astro-web]
  CMS --> Mongo[(MongoDB)]
  CMS --> Minio[(Private MinIO)]
  MinioInit[minio-init] --> Minio
```

Dokploy's native Traefik terminates TLS, routes domains, redirects HTTP, and supports
WebSockets. No Nginx sidecar is required. Route the CMS domain to `payload-cms:3000`
and the web domain to `astro-web:4321` through Dokploy's service domain settings.

All services start together as one Compose project. The web build uses safe defaults
when CMS globals and collections are unseeded, so no profile or deployment gate is required.

MinIO has no public domain. Its host bindings are localhost-only in Compose, and
Payload reaches it over Docker DNS at `http://minio:9000`. The bootstrap service
creates `S3_BUCKET` and applies an anonymous `none` policy. Media is served through
Payload access-controlled endpoints.

## Build and startup

The CMS image is pulled from GHCR by default and can also be built locally through the
compose `build` fallback. The Astro image is built locally and reads public CMS data through
Payload's native access control.

On first deployment, start the complete project:

```bash
docker compose up -d --build
```

After startup, open the CMS admin and seed content as needed. The web remains buildable
with empty globals and collections.

## Environment

Required values include `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `ASTRO_SITE_URL`,
email settings, and S3 values (`S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and
`S3_SECRET_ACCESS_KEY`). Optional webhook and Dokploy cache-busting values are listed
in `.env.example`.

Compose sets `DATABASE_URI`, `S3_ENDPOINT`, `NODE_ENV`, `HOST`, and `PORT` so these
values remain aligned with the internal service topology.

## Ongoing deployments and rollback

```bash
# Pull a published CMS image and restart it
docker compose pull payload-cms
docker compose up -d payload-cms

# Rebuild the complete project after code/content changes
docker compose up -d --build
```

Set `IMAGE_TAG` to an immutable GHCR tag for CMS rollback. Revert the source revision
and rebuild `astro-web` to roll back the web output.

## Platform Guides

- Dokploy: [`dokploy/setup.md`](dokploy/setup.md)
- Manual Compose/custom proxy: [`custom/setup.md`](custom/setup.md)
