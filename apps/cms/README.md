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
- Uses `@payloadcms/plugin-seo` for SEO metadata.
- Uses Lexical editor for long-form content.
- Converts post Lexical JSON to markdown on API read (`contentMarkdown`).
