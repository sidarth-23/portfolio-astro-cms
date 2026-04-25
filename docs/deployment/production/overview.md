# Production Deployment Overview

## Build Model

- Docker images are built and published by GitHub Actions.
- Production pulls prebuilt images from GHCR rather than building from source on
  the server.
- Use immutable SHA tags for rollback and branch tags (`main`, `staging`) for
  convenience.

## Compose Files

| File                                  | Purpose                                        |
| ------------------------------------- | ---------------------------------------------- |
| `deployment/docker-compose.local.yml` | Local dev infrastructure (MongoDB, MinIO only) |
| `deployment/docker-compose.prod.yml`  | **Production** — pulls prebuilt GHCR images    |

## Production Stack

`deployment/docker-compose.prod.yml` defines five services:

| Service       | Image                                        | Role                                   |
| ------------- | -------------------------------------------- | -------------------------------------- |
| `mongodb`     | `mongo:7`                                    | Primary database for Payload CMS       |
| `minio`       | `minio/minio:latest`                         | S3-compatible object storage for media |
| `minio-init`  | `minio/mc:latest`                            | One-shot bucket provisioning           |
| `payload-cms` | `ghcr.io/sidarth-g/sidshub-cms:${IMAGE_TAG}` | Payload CMS backend                    |
| `astro-web`   | `ghcr.io/sidarth-g/sidshub-web:${IMAGE_TAG}` | Astro frontend                         |

`payload-cms` waits for MongoDB and MinIO to be healthy before starting.
`astro-web` is fully independent — it has no `depends_on` and its failure never
blocks the CMS stack.

The following values are hardcoded in `deployment/docker-compose.prod.yml` and must not be
overridden via environment variables:

| Variable        | Value                             |
| --------------- | --------------------------------- |
| `DATABASE_URI`  | `mongodb://mongodb:27017/payload` |
| `S3_ENDPOINT`   | `http://minio:9000`               |
| `NODE_ENV`      | `production`                      |
| `HOST` / `PORT` | `0.0.0.0` / `4321` (astro-web)    |

## Platform Guides

| Platform                       | Guide                                                                      |
| ------------------------------ | -------------------------------------------------------------------------- |
| Custom (manual Docker Compose) | [`custom/setup.md`](custom/setup.md)                                       |
| Dokploy (template recommended) | [`dokploy/setup.md`](dokploy/setup.md) — template in `deployment/dokploy/` |

## First Deployment (Bootstrap)

The Astro web app builds statically at image-build time in GitHub Actions — it
fetches all page data from the live CMS API during `turbo run build`. This means
**the CMS must be running and seeded before a web image can be built successfully**.

On the very first deployment, the `sidshub-web` image does not yet exist in GHCR
because there is no running CMS to fetch data from. This is expected:

1. **Deploy the compose stack.** MongoDB, MinIO, and CMS will start. The
   `astro-web` service will fail to start (no image in GHCR). This is normal —
   it does not affect the CMS.
2. **Access the CMS admin URL**, create an admin account, and seed required
   content for all pages (home, projects, blog, CV, site-settings, etc.).
3. **Trigger the web image build** via GitHub Actions `workflow_dispatch` on
   `publish-images.yml` (or push any change to `apps/web/`). The build fetches
   content from the live CMS API.
4. **Once the web image is published to GHCR**, redeploy the compose stack (or
   wait for auto-deploy). `astro-web` will now start successfully.

### Ongoing deployments

After bootstrap, pushes to `main` or `staging` trigger image builds automatically.
For deployments that change both CMS and Web:

- The CMS image builds and deploys first.
- The web image build uses the live CMS API, so it requires the CMS to be up
  with current data.
- If the CMS is down or missing data for a page, the web image build will fail
  in CI — this prevents a broken web image from deploying.

## DNS Requirements

Point these A records to the server IP before deploying:

- `www.sidshub.in`
- `sidshub.in`
- `cms.sidshub.in`

## Required Env Vars

All values below are provided at runtime via `.env.prod.example`.

### Shared (both services)

| Variable               | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `IMAGE_TAG`            | GHCR image tag (`main`, `staging`, or a SHA)               |
| `S3_ACCESS_KEY_ID`     | MinIO/S3 access key (also used for MinIO root credentials) |
| `S3_SECRET_ACCESS_KEY` | MinIO/S3 secret key                                        |
| `S3_BUCKET`            | Bucket name (default: `sidshub-media`)                     |
| `S3_REGION`            | Bucket region (default: `us-east-1`)                       |

### payload-cms

| Variable                    | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| `PAYLOAD_SECRET`            | Payload secret key                                         |
| `CMS_READ_TOKEN`            | Read-only API token                                        |
| `PAYLOAD_PUBLIC_SERVER_URL` | Public URL of the CMS                                      |
| `ASTRO_SITE_URL`            | Public URL of the web app                                  |
| `RESEND_API_KEY`            | Resend transactional email API key                         |
| `EMAIL_FROM_ADDRESS`        | Sender email address                                       |
| `EMAIL_FROM_NAME`           | Sender display name                                        |
| `WEB_DEPLOY_WEBHOOK_URL`    | Webhook URL to trigger web redeployment on content publish |
| `WEB_DEPLOY_BRANCH`         | Branch to reference in webhook payload (default: `main`)   |
| `MEDIA_CLEANUP_DAYS`        | Optional, default `7`                                      |
| `MEDIA_CLEANUP_DRY_RUN`     | Optional, default `false`                                  |

### astro-web

| Variable               | Description               |
| ---------------------- | ------------------------- |
| `ASTRO_SITE_URL`       | Public URL of the web app |
| `ASTRO_CMS_API_URL`    | Public CMS API URL        |
| `ASTRO_CMS_READ_TOKEN` | Read-only API token       |

## Publish Flow

### Code Releases

1. Push to `main` or `staging`.
2. GitHub Actions builds the affected Docker images and publishes them to GHCR.
3. The hosting platform redeploys the stack, pulling the updated image tags.

### Content Releases

1. Editor publishes content in Payload.
2. `afterChange` hook sends a push webhook to `WEB_DEPLOY_WEBHOOK_URL`.
3. The hosting platform redeploys, pulling the latest web image for the branch.

## Deployment Order

- `mongodb` and `minio` start first; `payload-cms` waits for both to be healthy.
- `minio-init` provisions the bucket after MinIO is healthy.
- `payload-cms` starts after MongoDB, MinIO, and minio-init are all ready.
- `astro-web` starts independently — no dependency on any other service.

## Rollback

Set `IMAGE_TAG` to a specific SHA tag (e.g. `sha-abc1234`) and redeploy. SHA tags
are immutable and published for every push to `main` and `staging` by CI.

## GitHub Actions Configuration

### Repository Variables

- `ASTRO_SITE_URL`, `ASTRO_CMS_API_URL`, `PAYLOAD_PUBLIC_SERVER_URL`
- `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`
- `WEB_DEPLOY_WEBHOOK_URL`, `WEB_DEPLOY_BRANCH`
- `SITE_BUILD_HOOK_TYPE`, `SITE_BUILD_HOOK_URL`
- `SITE_BUILD_HOOK_DOKPLOY_APP_ID`, `SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID`

### Repository Secrets

- `ASTRO_CMS_READ_TOKEN`, `PAYLOAD_SECRET`, `DATABASE_URI`, `CMS_READ_TOKEN`
- `RESEND_API_KEY`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `SITE_BUILD_HOOK_SECRET`

## MinIO Bucket Provisioning

- `minio-init` provisions `S3_BUCKET` on every compose startup when
  `MINIO_CREATE_BUCKET_ON_STARTUP=true` (default in `deployment/docker-compose.prod.yml`).
- `mc mb --ignore-existing` makes re-provisioning on restarts safe.
- CMS only enables S3 storage when the full S3 configuration is present;
  otherwise it falls back to Payload's local upload storage for `media`.

## Scheduled Media Cleanup

- Command: `bun run --filter @sidshub/cms cleanup:media`
- Schedule: `0 3 * * *`
- Prefer a platform scheduler over embedding cron logic in the CMS runtime.
- First run: `MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`
