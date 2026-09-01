# Dokploy Setup

Deploy three independent Dokploy resources. Do not deploy root `docker-compose.yml`; it remains local MongoDB and MinIO infrastructure for development.

## Prerequisites

- Dokploy installed on a VPS and a DNS A record for the shared HTTPS hostname.
- Repository access for Dokploy source builds.
- A private AWS S3 or compatible bucket, plus CMS-scoped credentials.
- A controlled host with MinIO Client (`mc`) for the media migration.

## 1. Create `sidshub-mongodb`

Create a Dokploy **MongoDB** database named `sidshub-mongodb` with persistent storage. Do not configure a domain or an Advanced port. Copy Dokploy's generated **Internal Connection URL** verbatim into the CMS `DATABASE_URI`; it is for the CMS-to-database private-network connection only. Do not use internal credentials externally.

## 2. Provision private object storage

Create `S3_BUCKET` in `S3_REGION`, block all anonymous public access, and create credentials scoped only to object read/write/delete and list operations for that bucket or its selected prefix. Keep the access key and secret in Dokploy CMS service secrets. Never put them in Git, Dockerfile `ARG`, or build arguments.

Set `S3_ENDPOINT` only for a provider that needs a custom endpoint. Leave it unset for AWS S3. Do not configure MinIO, a Dokploy network alias, or a host-published MinIO port in production.

## 3. Create `sidshub-cms`

Create a Dokploy **Application** with:

| Setting          | Value                 |
| ---------------- | --------------------- |
| Source           | This repository       |
| Build type       | Dockerfile            |
| Dockerfile path  | `apps/cms/Dockerfile` |
| Build context    | `.`                   |
| Application port | `3000`                |

Set the CMS runtime configuration as scoped secrets, including `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `ASTRO_SITE_URL`, `DATABASE_URI` from step 1, email configuration, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Set `S3_ENDPOINT` only when required by the selected compatible provider.

Add the shared hostname's `/admin` and `/api` Traefik domain routes to port `3000`. Do not configure an Advanced port.

## 4. Create `sidshub-web`

Create a second Dokploy **Application** with:

| Setting          | Value                 |
| ---------------- | --------------------- |
| Source           | This repository       |
| Build type       | Dockerfile            |
| Dockerfile path  | `apps/web/Dockerfile` |
| Build context    | `.`                   |
| Application port | `4321`                |

Set `ASTRO_SITE_URL` to the canonical HTTPS origin and `ASTRO_CMS_API_URL` to that same origin plus `/api` as Docker build arguments. They are public build configuration, not runtime secrets. Add the shared hostname's `/` Traefik domain route to port `4321`, after the CMS `/admin` and `/api` routes. Do not configure an Advanced port.

Only CMS and managed MongoDB require Dokploy internal networking. S3 is external HTTPS access.

## 5. Migrate in this order

1. Back up the existing MongoDB data.
2. Create the private S3 bucket and CMS-scoped credentials.
3. On a controlled host, configure `local` for the existing MinIO endpoint and `remote` for the S3 endpoint and credentials, then migrate media:

   ```bash
   mc mirror --overwrite local/<S3_BUCKET> remote/<S3_BUCKET>
   ```

4. Verify equal source and destination object counts and sample object checksums. Confirm anonymous public S3 access is denied and the CMS credential cannot access another bucket.
5. Deploy `sidshub-mongodb` and restore the MongoDB backup.
6. Deploy `sidshub-cms` with the production S3 settings. Verify existing media downloads and a new Payload admin upload.
7. Deploy `sidshub-web`.
8. Move DNS/routes, then request `/`, `/api/health`, and `/admin`. They must reach web, CMS health, and Payload admin respectively.
9. Retire the old unified production Compose project only after all preceding checks pass. Do not retire local Compose.

## Dokploy notes

Application domains hot-reload through Traefik's file provider. Dockerfile build arguments must not contain secrets; use Dokploy build-time secrets if a build needs sensitive values.

- [Dockerfile application builds](https://docs.dokploy.com/docs/core/applications/build-type)
- [Traefik domains](https://docs.dokploy.com/docs/core/domains)
- [Database internal connections](https://docs.dokploy.com/docs/core/databases/connection)
- [Payload S3 adapter](https://payloadcms.com/docs/upload/storage-adapters)
- [Shared-network DNS requirement](https://github.com/Dokploy/dokploy/issues/1335)
- [Build-time runtime-network limitation](https://github.com/Dokploy/dokploy/issues/2413)
- [Compose remote-build-server limitation](https://github.com/Dokploy/dokploy/issues/4148)
- [Compose `--build` cache limitation](https://github.com/Dokploy/dokploy/issues/5020)
