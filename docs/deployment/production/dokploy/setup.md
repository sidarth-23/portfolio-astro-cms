# Production Setup: Dokploy CMS + Cloudflare Pages Web

The production topology is intentionally split:

- **CMS**: Dokploy application, backed by a private MongoDB database and Cloudflare R2.
- **Web**: Cloudflare Pages static build.
- **Media**: R2 custom domain for public reads; S3 API credentials stay CMS-only.

Do not deploy the root `docker-compose.yml` to production. It is local development infrastructure for MongoDB and MinIO.

## Prerequisites

- A Cloudflare-managed zone for the site.
- A Dokploy VPS with HTTPS and repository access.
- A MongoDB database reachable from the Dokploy CMS application over the private Dokploy network.
- A Cloudflare R2 bucket and an R2 custom domain, for example `media.example.com`.
- Resend API key and a verified sender domain.

## 1. Create R2 securely

1. Create a production bucket, for example `sidshub-media`.
2. Add an R2 custom domain such as `media.example.com`.
3. Use the custom domain for media reads. Do not use an `r2.dev` URL in production; it is intended for development and does not provide the same cache/security controls.
4. Create an R2 API token with **Object Read & Write**, scoped to this bucket only. The CMS needs read, write, list, and delete behavior through the S3-compatible API. Do not grant account-wide administration.
5. Store the resulting Access Key ID and Secret Access Key only as Dokploy CMS secrets.
6. Keep the S3 API endpoint private to the configuration: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Set `S3_ENDPOINT` to that value and `S3_REGION=auto`.
7. Set `S3_PUBLIC_URL=https://media.example.com/` (including the trailing slash).
8. Verify that the R2 custom domain serves an uploaded object, that the bucket root does not list objects, and that the S3 credentials cannot access another bucket.

The R2 bucket's object reads are public because the website must read media directly. This does **not** expose the S3 credentials. Do not put private documents or secrets in this bucket. If media must be private, the current `generateFileURL` implementation is insufficient; use signed URLs or a CMS/Worker proxy instead.

## 2. Create the CMS database

Create a Dokploy MongoDB database named `sidshub-mongodb` with persistent storage and backups enabled. Do not publish a database domain or host port.

Copy Dokploy's generated **Internal Connection URL** verbatim into the CMS `DATABASE_URI`. Use the private connection only from the CMS application; never put it in Cloudflare Pages variables or client code.

Before the first production release, decide the backup retention and perform a restore test. Payload uses MongoDB in this repository; PostgreSQL is not compatible with the configured adapter.

## 3. Deploy CMS on Dokploy

Create a Dokploy Application with:

| Setting          | Value                                          |
| ---------------- | ---------------------------------------------- |
| Source           | This repository                                |
| Build type       | Dockerfile                                     |
| Dockerfile path  | `apps/cms/Dockerfile`                          |
| Build context    | repository root (`.`)                          |
| Application port | `3000`                                         |
| Start command    | Dockerfile default (`node apps/cms/server.js`) |

Set these **runtime secrets/variables** on the CMS application:

```text
NODE_ENV=production
PAYLOAD_SECRET=<long random secret, stable across deploys>
PAYLOAD_PUBLIC_SERVER_URL=https://cms.example.com
ASTRO_SITE_URL=https://www.example.com
DATABASE_URI=<Dokploy internal MongoDB URL>
S3_BUCKET=sidshub-media
S3_REGION=auto
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://media.example.com/
S3_ACCESS_KEY_ID=<bucket-scoped R2 token access key>
S3_SECRET_ACCESS_KEY=<bucket-scoped R2 token secret>
RESEND_API_KEY=<secret>
EMAIL_FROM_ADDRESS=<verified sender>
EMAIL_FROM_NAME=<sender name>
```

Use a separate CMS hostname, such as `cms.example.com`, and route it to port 3000. This is preferable to path-routing `/admin` and `/api` through the Pages site: it avoids reverse-proxy conflicts and gives the web build one stable public API origin. Do not expose MongoDB or the R2 S3 endpoint through Dokploy.

After deploy, check:

```text
https://cms.example.com/api/health  -> {"status":"ok"}
https://cms.example.com/admin        -> Payload admin
https://cms.example.com/api/posts?limit=1 -> published API response
```

Create the first admin user, log in, upload one image, and confirm that its URL starts with `https://media.example.com/`.

## 4. Deploy web on Cloudflare Pages

Create a Pages project from the repository. Configure the monorepo build from the repository root:

| Setting                | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| Root directory         | `/`                                                      |
| Build command          | `bun install --frozen-lockfile && bun run build:web`     |
| Build output directory | `apps/web/dist`                                          |
| Node/Bun version       | Bun `1.3.6` (or the repository's configured Bun version) |

Set these Pages **build-time variables**:

```text
ASTRO_SITE_URL=https://www.example.com
ASTRO_CMS_API_URL=https://cms.example.com/api
```

`ASTRO_CMS_API_URL` is public build configuration, not a secret. The static build fetches CMS globals and published content, so the CMS must be healthy and publicly reachable from Cloudflare's build environment before starting a Pages deployment.

Attach the production domain to Pages. Do not copy `DATABASE_URI`, `PAYLOAD_SECRET`, R2 credentials, or Resend credentials into Pages.

## 5. Release sequence

1. Create/verify R2 bucket, custom domain, and scoped token.
2. Create MongoDB and verify its private connection URL.
3. Configure CMS secrets in Dokploy and deploy CMS.
4. Wait for `/api/health`, admin login, API reads, email delivery, and an R2 upload/download to pass.
5. Configure Pages build variables and deploy the web project.
6. Smoke-test `/`, `/blog`, `/projects`, `/cv`, a media URL, and a missing route.
7. Only then switch production DNS or remove the previous deployment.

For content changes, repeat steps 3–6 when the static site must include new CMS data. A CMS publish does not automatically rebuild an already-deployed static Pages artifact unless a webhook triggers a Pages deploy.

## Local development sequence

```bash
cp .env.example .env
task up
# configure apps/cms/.env with local MongoDB/MinIO and required Payload/email values
bun install
bun run dev:cms
# in another terminal:
bun run dev:web
```

Local CMS uses MongoDB and MinIO from `docker-compose.yml`; production uses MongoDB and R2. Do not reuse local `minioadmin` credentials in Dokploy.

## Migration checks

Before cutover:

1. Back up MongoDB and test the archive restore.
2. Mirror existing MinIO objects to R2 with `mc mirror --overwrite` from a controlled host.
3. Compare object counts and sample checksums.
4. Confirm anonymous reads work only through the intended media custom domain; confirm S3 API credentials are not exposed.
5. Deploy CMS against the restored database and verify old media plus a new upload.
6. Deploy Pages only after the CMS build dependency is healthy.

## References

- [Cloudflare R2 authentication](https://developers.cloudflare.com/r2/api/tokens/)
- [Cloudflare R2 public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Astro Cloudflare deployment](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Dokploy Dockerfile applications](https://docs.dokploy.com/docs/core/applications/build-type)
- [Payload S3 storage adapter](https://payloadcms.com/docs/upload/storage-adapters)
