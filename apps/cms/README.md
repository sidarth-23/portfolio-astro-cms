# Payload CMS

## Scripts

```bash
bun run dev:cms
bun run build:cms
bun run payload:types
bun run --filter @sidshub/cms cleanup:media
```

## Environment

Copy the root `.env.cms.example` to `apps/cms/.env` and fill required values.

Required for web read access over REST:

- `CMS_READ_TOKEN` (must match `ASTRO_CMS_READ_TOKEN` used by the web app)

Required for auth email delivery via Resend:

- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `PAYLOAD_PUBLIC_SERVER_URL` (used to generate absolute verification/reset links)

## Notes

- Uses MongoDB as primary DB.
- Uses MinIO (S3-compatible) for media storage.
- Bucket provisioning is owned by infrastructure (Compose/Taskfile), not CMS runtime.
- CMS validates bucket presence at startup and fails fast when the bucket is missing.
- No migration workflow is required in local or production runtime.
- Uses `@payloadcms/plugin-seo` for SEO metadata.
- Uses Lexical editor for long-form content.
- Uses `@payloadcms/email-resend` for auth emails.
- Users collection is invite-only (first user bootstraps via admin, subsequent users created by authenticated admins). Password reset emails via Resend.

## Database Workflow

- Development:
  - `task up` or `task up:build` starts local MongoDB and MinIO.
  - `bun run dev:cms` runs the CMS locally with MongoDB adapter configuration; Turbo prebuilds shared package dependencies and starts package watchers from `turbo.json`.
- Production:
  - Start CMS directly (`bun run build:cms` and `bun run --filter @sidshub/cms start`).
  - No migration sidecar/job is required.

## Staging/Prod Release Order

1. Start CMS: `bun run build:cms` / `bun run --filter @sidshub/cms start`
2. Build/deploy web after CMS health is green.

This order is required because `apps/web` fetches CMS globals at build time and should fail fast when CMS is unhealthy.

## Troubleshooting

If you see errors like `Cannot find module './vendor-chunks/date-fns.js'` while running CMS dev:

- Cause: stale or incomplete Next.js dev artifacts in `apps/cms/.next`.
- Resolution: run the CMS dev script again (`bun run dev:cms`), which now clears `.next` before starting.

If you see S3 errors like `NoSuchBucket` for media files:

- Cause: local MinIO bucket has not been created yet.
- Resolution: run `task up` or `task up:build` so Taskfile provisions the bucket via `minio-init`.

## Media Uploads

- Media uploads use Payload's default upload UI.
- `Paste URL` is configured to fetch server-side only for approved domains via `upload.pasteURL.allowList` in the shared `Media` collection config.
- Imported files are stored in your own media collection and S3 bucket. Remote source URLs are not used for rendering.

## Media Cleanup

- Orphaned media cleanup runs via the `cleanup:media` script.
- Recommended scheduler command:
  `bun run --filter @sidshub/cms cleanup:media`
- Recommended schedule: daily at `0 3 * * *`.
- Optional environment variables:
  - `MEDIA_CLEANUP_DAYS` (default: `7`)
  - `MEDIA_CLEANUP_DRY_RUN` (`true` or `false`)
- Recommended first run:
  `MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`

If `bun run dev:cms` fails with a database preflight error:

- Cause: `DATABASE_URI` is missing or not a MongoDB URI.
- Resolution:
  - update `apps/cms/.env`
  - ensure `DATABASE_URI` uses `mongodb://` or `mongodb+srv://`
  - restart `bun run dev:cms`
