# Payload CMS

## Scripts

```bash
bun run dev:cms
bun run build:cms
bun run payload:types
bun run --filter @sidshub/cms migrate:create
bun run --filter @sidshub/cms migrate
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

- Uses PostgreSQL as primary DB.
- Uses MinIO (S3-compatible) for media storage.
- Auto-creates the configured S3 bucket in local dev (or when `S3_AUTO_CREATE_BUCKET=true`).
- DB schema push is disabled by default in every environment.
- Set `PAYLOAD_DB_PUSH=true` only for an explicit local escape hatch. Normal development should stay migration-only.
- Uses `@payloadcms/plugin-seo` for SEO metadata.
- Uses Lexical editor for long-form content.
- Uses `@payloadcms/email-resend` for auth emails.
- Users collection is invite-only (first user bootstraps via admin, subsequent users created by authenticated admins). Password reset emails via Resend.

## Migration Workflow

- Development:
  - `bun run dev:cms` does not run `payload migrate`.
  - `bun run dev:cms` runs a strict migration preflight before the server starts.
  - If migrations are pending, or the local DB contains Payload's `dev` push marker, startup fails with an explicit error.
  - Normal workflow is: change schema -> `bun run --filter @sidshub/cms migrate:create` -> `bun run --filter @sidshub/cms migrate` -> restart CMS.
  - `bun run --filter @sidshub/cms db:check` runs the same preflight without starting dev.
  - `bun run --filter @sidshub/cms dev:push` is available as an unsafe local-only escape hatch and intentionally bypasses the strict flow.
- Production:
  - Create migrations from schema changes: `bun run --filter @sidshub/cms migrate:create`
  - Apply migrations in CI/CD before starting CMS: `bun run --filter @sidshub/cms migrate`
  - Do not auto-run migrations in app startup.

## Staging/Prod Release Order

1. Run migrations: `bun run --filter @sidshub/cms migrate`
2. Start CMS: `bun run build:cms` / `bun run --filter @sidshub/cms start`
3. Build/deploy web after CMS health is green.

This order is required because `apps/web` fetches CMS globals at build time and should fail fast when CMS is unhealthy.

## Troubleshooting

If you see errors like `Cannot find module './vendor-chunks/date-fns.js'` while running CMS dev:

- Cause: stale or incomplete Next.js dev artifacts in `apps/cms/.next`.
- Resolution: run the CMS dev script again (`bun run dev:cms`), which now clears `.next` before starting.

If you see S3 errors like `NoSuchBucket` for media files:

- Cause: local MinIO bucket has not been created yet.
- Resolution: set `S3_AUTO_CREATE_BUCKET=true` (default in `.env.cms.example`) and restart CMS dev.

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

If you see `column site_settings.profile_image_id does not exist`:

- Cause: missing migration in the target environment.
- Resolution:
  - Run `bun run --filter @sidshub/cms migrate`
  - Verify with SQL:
    `SELECT column_name FROM information_schema.columns WHERE table_name='site_settings' AND column_name='profile_image_id';`
  - Confirm `/api/globals/site-settings?depth=2` returns `200`

If `bun run dev:cms` fails with a `payload_migrations` / `dev` marker error:

- Cause: the local database was previously changed via Payload schema push.
- Resolution:
  - reset the local DB
  - run `bun run --filter @sidshub/cms migrate`
  - restart `bun run dev:cms`
