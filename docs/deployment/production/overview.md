# Production Deployment Overview

## Build Model

| App           | How it's built                                    | Why                                                                                              |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `sidshub-cms` | GitHub Actions → GHCR (`ghcr.io/.../sidshub-cms`) | No secrets at build time; image is safe to publish publicly.                                     |
| `astro-web`   | `docker compose build` on the deployment server   | Build requires `ASTRO_CMS_READ_TOKEN`; building locally keeps the token off any public registry. |

The web app is an Astro SSG application — it fetches all page data from the live CMS API
during `docker compose build` and bakes it into static HTML. The token is used
only during that build step and is never stored in a registry image.

## Compose Files

| File                                  | Purpose                                            |
| ------------------------------------- | -------------------------------------------------- |
| `deployment/docker-compose.local.yml` | Local dev infrastructure (MongoDB, MinIO only)     |
| `deployment/cms/docker-compose.yml`   | **Production CMS stack** — infra + CMS from GHCR   |
| `deployment/web/docker-compose.yml`   | **Production Web app** — built locally from source |

The CMS and Web are separate, independent stacks. The CMS stack manages its own
infrastructure (MongoDB, MinIO). The Web stack is a single service with no runtime
dependencies on the CMS.

## Production Stack

### CMS Stack — `deployment/cms/docker-compose.yml`

| Service       | Image / Build                                | Role                                   |
| ------------- | -------------------------------------------- | -------------------------------------- |
| `mongodb`     | `mongo:7`                                    | Primary database for Payload CMS       |
| `minio`       | `minio/minio:latest`                         | S3-compatible object storage for media |
| `minio-init`  | `minio/mc:latest`                            | One-shot bucket provisioning           |
| `payload-cms` | `ghcr.io/sidarth-g/sidshub-cms:${IMAGE_TAG}` | Payload CMS backend                    |

`payload-cms` waits for MongoDB and MinIO to be healthy before starting.

The following values are hardcoded in `deployment/cms/docker-compose.yml` and must not be
overridden via environment variables:

| Variable       | Value                             |
| -------------- | --------------------------------- |
| `DATABASE_URI` | `mongodb://mongodb:27017/payload` |
| `S3_ENDPOINT`  | `http://minio:9000`               |
| `NODE_ENV`     | `production`                      |

### Web Stack — `deployment/web/docker-compose.yml`

| Service     | Image / Build                            | Role                 |
| ----------- | ---------------------------------------- | -------------------- |
| `astro-web` | Built locally from `apps/web/Dockerfile` | Astro frontend (SSG) |

`astro-web` has no runtime dependencies — it operates independently of the CMS once built.

The following values are hardcoded in `deployment/web/docker-compose.yml`:

| Variable        | Value                          |
| --------------- | ------------------------------ |
| `HOST` / `PORT` | `0.0.0.0` / `4321` (astro-web) |

## Platform Guides

| Platform                       | Guide                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Custom (manual Docker Compose) | [`custom/setup.md`](custom/setup.md)                                                                          |
| Dokploy (template recommended) | [`dokploy/setup.md`](dokploy/setup.md) — templates in `deployment/dokploy/cms/` and `deployment/dokploy/web/` |

## First Deployment (Bootstrap)

The web app requires a running, seeded CMS to build successfully — it fetches all page data
from the CMS API at `docker compose build` time. On the very first deployment there is no
seeded CMS yet, so the web build must be deferred.

**Bootstrap sequence:**

1. **Start the CMS stack:**

   ```bash
   docker compose -f deployment/cms/docker-compose.yml up -d
   ```

2. **Access the CMS admin URL**, create an admin account, and seed all required content
   (home page, projects, blog posts, CV, site-settings, etc.).

3. **Build and start the web app** once the CMS has content:
   ```bash
   docker compose -f deployment/web/docker-compose.yml build
   docker compose -f deployment/web/docker-compose.yml up -d
   ```

### Ongoing deployments

After bootstrap, the CMS image is updated automatically via GitHub Actions on every push to
`main` or `staging`. The web app is rebuilt on the deployment server whenever content is
published or code changes (see Publish Flow below).

## DNS Requirements

Point these A records to the server IP before deploying:

- `www.sidshub.in`
- `sidshub.in`
- `cms.sidshub.in`

## Required Env Vars

### CMS stack — `deployment/cms/.env` (copied from `.env.prod.example`)

| Variable                    | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `IMAGE_TAG`                 | GHCR image tag to pull (`main`, `staging`, or SHA)         |
| `PAYLOAD_SECRET`            | Payload secret key                                         |
| `CMS_READ_TOKEN`            | Read-only API token                                        |
| `PAYLOAD_PUBLIC_SERVER_URL` | Public URL of the CMS                                      |
| `ASTRO_SITE_URL`            | Public URL of the web app (used by CMS for CORS/redirects) |
| `RESEND_API_KEY`            | Resend transactional email API key                         |
| `EMAIL_FROM_ADDRESS`        | Sender email address                                       |
| `EMAIL_FROM_NAME`           | Sender display name                                        |
| `S3_ACCESS_KEY_ID`          | MinIO/S3 access key (also used for MinIO root credentials) |
| `S3_SECRET_ACCESS_KEY`      | MinIO/S3 secret key                                        |
| `S3_BUCKET`                 | Bucket name (default: `sidshub-media`)                     |
| `S3_REGION`                 | Bucket region (default: `us-east-1`)                       |
| `WEB_DEPLOY_WEBHOOK_URL`    | Webhook URL to trigger web rebuild on content publish      |
| `WEB_DEPLOY_BRANCH`         | Branch to reference in webhook payload (default: `main`)   |

### Web stack — `deployment/web/.env` (copied from `.env.prod.example`)

| Variable               | Description                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| `ASTRO_SITE_URL`       | Public URL of the web app                                            |
| `ASTRO_CMS_API_URL`    | Public CMS API URL (must be reachable from the server at build time) |
| `ASTRO_CMS_READ_TOKEN` | Read-only API token — must match `CMS_READ_TOKEN` from the CMS stack |

`ASTRO_CMS_API_URL` and `ASTRO_CMS_READ_TOKEN` are Docker build args consumed during
`docker compose build`. They are never stored in the resulting image or any registry.

## Publish Flow

### Code Releases (CMS)

1. Push to `main` or `staging`.
2. GitHub Actions builds the CMS Docker image and publishes it to GHCR with multiple tags:
   - `v1.0.<run_number>` — immutable semver tag tied to the CI run
   - branch name (`main` or `staging`) — mutable, always points to latest on that branch
   - `sha-<commit>` — immutable, tied to the exact commit
3. The hosting platform redeploys the CMS. `pull_policy: always` in the compose file
   ensures Docker always checks the registry for the latest digest of the branch tag,
   downloading only changed layers.
4. Web app is rebuilt on the server via the deploy webhook.

### Code Releases (Web)

The web app has no pre-built image in GHCR. To deploy a code change to `apps/web/`:

```bash
docker compose -f deployment/web/docker-compose.yml build
docker compose -f deployment/web/docker-compose.yml up -d
```

Automate this by wiring the `WEB_DEPLOY_WEBHOOK_URL` to a script on the server that runs
the above commands (or configure Dokploy's Auto Deploy — see the Dokploy guide).

### Content Releases

1. Editor publishes content in Payload CMS.
2. `afterChange` hook POSTs to `WEB_DEPLOY_WEBHOOK_URL`.
3. The hosting platform rebuilds the web app with the new content.

## Deployment Order

**CMS stack internal order:**

- `mongodb` and `minio` start first; `payload-cms` waits for both to be healthy.
- `minio-init` provisions the bucket after MinIO is healthy.
- `payload-cms` starts after MongoDB, MinIO, and minio-init are all ready.

**Cross-stack order:**

- The CMS stack must be deployed first on initial setup.
- The web stack is started independently after the CMS is seeded.
- At runtime, the two stacks operate fully independently.

## Rollback

**CMS:** Set `IMAGE_TAG` to a specific version tag (e.g. `v1.0.41`) in `deployment/cms/.env`
and redeploy. Version tags are the recommended rollback mechanism — they are short, readable,
and directly correspond to CI run numbers. SHA tags (e.g. `sha-abc1234`) are also available
for pinning to an exact commit. Both are immutable and published for every CMS push to
`main` and `staging` by CI.

```bash
# deployment/cms/.env
IMAGE_TAG=v1.0.41

docker compose -f deployment/cms/docker-compose.yml up -d payload-cms
```

**Web:** Revert the relevant commit, then rebuild:

```bash
git checkout <previous-commit>
docker compose -f deployment/web/docker-compose.yml build
docker compose -f deployment/web/docker-compose.yml up -d
```

## GitHub Actions Configuration

Only the CMS image is published by CI. No GitHub secrets or variables are required for
the web build — it is built on the deployment server using the local `.env` file.

### Repository Secrets (CMS image build — none required)

The CMS Dockerfile uses `SKIP_ENV_VALIDATION=1` at build time and receives no secrets
from CI. All secrets are injected at runtime via the server's `.env` file.

> The only CI secret needed is the auto-provided `GITHUB_TOKEN` for pushing to GHCR.

## MinIO Bucket Provisioning

- `minio-init` provisions `S3_BUCKET` on every compose startup when
  `MINIO_CREATE_BUCKET_ON_STARTUP=true` (default in `deployment/cms/docker-compose.yml`).
- `mc mb --ignore-existing` makes re-provisioning on restarts safe.

## Scheduled Media Cleanup

- Command: `bun run --filter @sidshub/cms cleanup:media`
- Schedule: `0 3 * * *`
- Prefer a platform scheduler over embedding cron logic in the CMS runtime.
- First run: `MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`
