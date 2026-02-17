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
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `SITE_BUILD_HOOK_URL`
- `SITE_BUILD_HOOK_SECRET`

### astro-web
- `ASTRO_SITE_URL`
- `ASTRO_CMS_API_URL`
- `ASTRO_CMS_READ_TOKEN`
- `ASTRO_CMS_HEALTH_TIMEOUT_MS` (optional)

## Publish Flow

1. Editor publishes content in Payload.
2. `afterChange` hook in Payload calls Dokploy deploy webhook (`SITE_BUILD_HOOK_URL`).
3. Dokploy rebuilds and redeploys `astro-web` static site.

## Domain Suggestion

- `www.sidshub.in` -> `astro-web`
- `cms.sidshub.in` -> `payload-cms`
