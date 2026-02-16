# Payload CMS

## Scripts

```bash
bun run dev:cms
bun run build:cms
bun run payload:types
bun run --filter @sidshub/cms migrate:create
bun run --filter @sidshub/cms migrate
```

## Environment

Copy `.env.example` to `.env` and fill required values.

## Notes

- Uses PostgreSQL as primary DB.
- Uses MinIO (S3-compatible) for media storage.
- Auto-creates the configured S3 bucket in local dev (or when `S3_AUTO_CREATE_BUCKET=true`).
- DB schema push behavior is controlled by `PAYLOAD_DB_PUSH` (`true` or `false`).
- If `PAYLOAD_DB_PUSH` is not set, default is `NODE_ENV !== "production"`:
  - local/dev: schema push enabled
  - production: schema push disabled
- Uses `@payloadcms/plugin-seo` for SEO metadata.
- Uses Lexical editor for long-form content.

## Migration Workflow

- Development:
  - `bun run dev:cms` does not run `payload migrate`.
  - Schema changes are pushed automatically by default.
- Production:
  - Create migrations from schema changes: `bun run --filter @sidshub/cms migrate:create`
  - Apply migrations in CI/CD before starting CMS: `bun run --filter @sidshub/cms migrate`
  - Do not auto-run migrations in app startup.

## Troubleshooting

If you see errors like `Cannot find module './vendor-chunks/date-fns.js'` while running CMS dev:

- Cause: stale or incomplete Next.js dev artifacts in `apps/cms/.next`.
- Resolution: run the CMS dev script again (`bun run dev:cms`), which now clears `.next` before starting.

If you see S3 errors like `NoSuchBucket` for media files:

- Cause: local MinIO bucket has not been created yet.
- Resolution: set `S3_AUTO_CREATE_BUCKET=true` (default in `.env.example`) and restart CMS dev.
