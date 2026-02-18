# Dokploy Deployment Guide

## Services

1. `postgres`
2. `minio`
3. `payload-cms`
4. `astro-web`

## Required Env Vars

### payload-cms
- `PAYLOAD_SECRET`
- `CMS_READ_TOKEN`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `DATABASE_URI`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_AUTO_CREATE_BUCKET` (recommended: `true` for MinIO)
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `DOKPLOY_API_URL`
- `DOKPLOY_API_KEY`
- `DOKPLOY_COMPOSE_ID`

### astro-web
- `ASTRO_SITE_URL`
- `ASTRO_CMS_API_URL`
- `ASTRO_CMS_READ_TOKEN`
- `ASTRO_CMS_HEALTH_TIMEOUT_MS` (optional)

## Publish Flow

1. Editor publishes content in Payload.
2. `afterChange` hook in Payload triggers Dokploy deploy through API (`DOKPLOY_API_URL` + `DOKPLOY_API_KEY` + `DOKPLOY_COMPOSE_ID`).
3. Dokploy rebuilds and redeploys `astro-web` static site.

## Deployment Order

- `astro-web` waits for `payload-cms` health before starting.
- `astro-web` runs `bun run build` at container startup, so the CMS is available during build on first deploy.

## Domain Suggestion

- `www.sidshub.in` -> `astro-web`
- `cms.sidshub.in` -> `payload-cms`
