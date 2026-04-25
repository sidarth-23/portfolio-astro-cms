# Deployment Guide

## Production Build Model

- Docker images are built and published by GitHub Actions.
- Production should pull prebuilt images from GHCR rather than building from source on the server.
- Dokploy remains responsible for running and updating containers.
- Use immutable SHA tags for rollback and branch tags (`main`, `staging`) for convenience.

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

### Code Releases

1. Push to `main` or `staging`.
2. GitHub Actions validates the repo, builds the affected Docker images, and publishes them to GHCR.
3. Dokploy updates services by pulling the published image tags.

### Content Releases

1. Editor publishes content in Payload.
2. `afterChange` hook in Payload triggers the Web deployment webhook (`WEB_DEPLOY_WEBHOOK_URL`) using branch `WEB_DEPLOY_BRANCH`.
3. Deployment platform redeploys the web service so it rolls forward to the already-published image tag for that branch.
4. In Dokploy, keep the Web app image tag strategy aligned with `WEB_DEPLOY_BRANCH`.

## Deployment Order

- Publish the CMS image first and wait for `payload-cms` health to pass.
- Publish the Web image after CMS is healthy.
- `payload-cms` starts after `mongodb` is healthy, `minio` is healthy, and `minio-init` completes.
- `astro-web` still builds static output during image build and fails fast when CMS data is unreachable or invalid.

## GitHub Actions Configuration

### Repository Variables

- `ASTRO_SITE_URL`
- `ASTRO_CMS_API_URL`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ENDPOINT`
- `WEB_DEPLOY_WEBHOOK_URL`
- `WEB_DEPLOY_BRANCH`
- `SITE_BUILD_HOOK_TYPE`
- `SITE_BUILD_HOOK_URL`
- `SITE_BUILD_HOOK_DOKPLOY_APP_ID`
- `SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID`

### Repository Secrets

- `ASTRO_CMS_READ_TOKEN`
- `PAYLOAD_SECRET`
- `DATABASE_URI`
- `CMS_READ_TOKEN`
- `RESEND_API_KEY`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `SITE_BUILD_HOOK_SECRET`

### Dokploy Setup

- Configure Dokploy apps to pull `ghcr.io/<owner>/sidshub-web:<tag>` and `ghcr.io/<owner>/sidshub-cms:<tag>`.
- Use branch tags for normal roll-forward (`main`, `staging`).
- Use SHA tags for explicit rollback.

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
