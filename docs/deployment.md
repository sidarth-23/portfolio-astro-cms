# Deployment Guide

## Compose Files

1. `docker-compose.cms.yml` - CMS stack (`postgres`, `minio`, `payload-migrate`, `payload-cms`)
2. `docker-compose.web.yml` - Web stack (`astro-web`)

## Required Env Vars

### payload-cms (CMS app)
- `PAYLOAD_SECRET`
- `CMS_READ_TOKEN`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `DATABASE_URI`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_AUTO_CREATE_BUCKET` (recommended: `true` for MinIO)
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `WEB_DEPLOY_WEBHOOK_URL`
- `WEB_DEPLOY_BRANCH`
- `MEDIA_CLEANUP_DAYS` (optional, default `7`)
- `MEDIA_CLEANUP_DRY_RUN` (optional, default `false`)

### astro-web (Web app)
- `ASTRO_SITE_URL`
- `ASTRO_CMS_API_URL`
- `ASTRO_CMS_READ_TOKEN`
- `ASTRO_CMS_HEALTH_TIMEOUT_MS` (optional)

## Publish Flow

1. Editor publishes content in Payload.
2. `afterChange` hook in Payload triggers the Web deployment webhook (`WEB_DEPLOY_WEBHOOK_URL`) using branch `WEB_DEPLOY_BRANCH`.
3. Deployment platform rebuilds and redeploys `astro-web` static site.
4. In Dokploy, keep the Web app branch aligned with `WEB_DEPLOY_BRANCH`.

## Deployment Order

- Deploy the CMS app (`docker-compose.cms.yml`) first.
- Wait for `payload-cms` health check to pass.
- Deploy the Web app (`docker-compose.web.yml`) after CMS is healthy.
- `payload-migrate` runs first and must exit successfully.
- `payload-cms` starts only after `payload-migrate` completes successfully.
- `payload-cms` must not run migrations in its own startup command; migrations are owned by `payload-migrate`.
- `astro-web` builds static output during image build and fails fast when CMS data is unreachable or invalid.

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

## Scheduled Media Cleanup

- Recommended scheduler command:
  `bun run --filter @sidshub/cms cleanup:media`
- Recommended schedule:
  `0 3 * * *`
- Prefer a Dokploy scheduled job or host cron over embedding cron logic in the CMS runtime.
- For the first run, use:
  `MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`
