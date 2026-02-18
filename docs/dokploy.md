# Dokploy Deployment Guide

## Services

1. `postgres`
2. `minio`
3. `payload-migrate`
4. `payload-cms`
5. `astro-web`

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

- `payload-migrate` runs first and must exit successfully.
- `payload-cms` starts only after `payload-migrate` completes successfully.
- `astro-web` waits for `payload-cms` health before starting.
- `astro-web` runs `bun run build` at container startup, so the CMS API is reachable during static prerender.

## Migration Recovery (Schema Drift)

If CMS logs include database errors like `column site_settings.profile_image_id does not exist`:

1. Run migrations in the CMS runtime: `bun run --filter @sidshub/cms migrate` (or `npm run migrate` inside `apps/cms`).
2. Validate the column exists:
   `SELECT column_name FROM information_schema.columns WHERE table_name='site_settings' AND column_name='profile_image_id';`
3. Validate API response:
   `GET /api/globals/site-settings?depth=2` should return `200`.
4. Redeploy/rebuild `astro-web` after CMS is healthy.

## Domain Suggestion

- `www.sidshub.in` -> `astro-web`
- `cms.sidshub.in` -> `payload-cms`
