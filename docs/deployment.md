# Deployment Guide

## Compose Files

1. `docker-compose.cms.yml` - CMS stack (`mongodb`, `minio`, `payload-cms`)
2. `docker-compose.web.yml` - Web stack (`astro-web`)

## Required Env Vars

### payload-cms (CMS app)

- `PAYLOAD_SECRET`
- `CMS_READ_TOKEN`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `ASTRO_SITE_URL`
- `DATABASE_URI`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `S3_BUCKET` (required only when using S3-compatible object storage)
- `S3_REGION` (required only when using S3-compatible object storage)
- `S3_ENDPOINT` (optional; required for MinIO and other custom S3-compatible endpoints)
- `MINIO_CREATE_BUCKET_ON_STARTUP` (recommended: `false`; set `true` only when you want compose to provision bucket)
- `S3_ACCESS_KEY_ID` (required only when using S3-compatible object storage)
- `S3_SECRET_ACCESS_KEY` (required only when using S3-compatible object storage)
- `WEB_DEPLOY_WEBHOOK_URL`
- `WEB_DEPLOY_BRANCH`
- `MEDIA_CLEANUP_DAYS` (optional, default `7`)
- `MEDIA_CLEANUP_DRY_RUN` (optional, default `false`)

### astro-web (Web app)

- `ASTRO_SITE_URL`
- `ASTRO_CMS_API_URL`
- `ASTRO_CMS_READ_TOKEN`

## Publish Flow

1. Editor publishes content in Payload.
2. `afterChange` hook in Payload triggers the Web deployment webhook (`WEB_DEPLOY_WEBHOOK_URL`) using branch `WEB_DEPLOY_BRANCH`.
3. Deployment platform rebuilds and redeploys `astro-web` static site.
4. In Dokploy, keep the Web app branch aligned with `WEB_DEPLOY_BRANCH`.

## Deployment Order

- Deploy the CMS app (`docker-compose.cms.yml`) first.
- Wait for `payload-cms` health check to pass.
- Deploy the Web app (`docker-compose.web.yml`) after CMS is healthy.
- `payload-cms` starts after `mongodb` is healthy, `minio` is healthy, and `minio-init` completes.
- `astro-web` builds static output during image build and fails fast when CMS data is unreachable or invalid.

## MinIO Bucket Provisioning

- Bucket provisioning is infrastructure-owned.
- `minio-init` in `docker-compose.cms.yml` provisions `S3_BUCKET` only when `MINIO_CREATE_BUCKET_ON_STARTUP=true`.
- CMS only enables the S3 storage adapter when the full S3 configuration is present.
- Without S3 configuration, Payload falls back to its default local upload storage for the `media` collection.

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
