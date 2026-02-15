# Payload CMS

## Scripts

```bash
bun run dev:cms
bun run build:cms
bun run payload:types
```

## Environment

Copy `.env.example` to `.env` and fill required values.

## Notes

- Uses PostgreSQL as primary DB.
- Uses MinIO (S3-compatible) for media storage.
- Auto-creates the configured S3 bucket in local dev (or when `S3_AUTO_CREATE_BUCKET=true`).
- Uses `@payloadcms/plugin-seo` for SEO metadata.
- Uses Lexical editor for long-form content.

## Troubleshooting

If you see errors like `Cannot find module './vendor-chunks/date-fns.js'` while running CMS dev:

- Cause: stale or incomplete Next.js dev artifacts in `apps/cms/.next`.
- Resolution: run the CMS dev script again (`bun run dev:cms`), which now clears `.next` before starting.

If you see S3 errors like `NoSuchBucket` for media files:

- Cause: local MinIO bucket has not been created yet.
- Resolution: set `S3_AUTO_CREATE_BUCKET=true` (default in `.env.example`) and restart CMS dev.
