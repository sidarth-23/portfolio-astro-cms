# Dokploy Setup

This guide covers configuring Dokploy to run the production stack defined in
`docker-compose.prod.yml`.

## Prerequisites

- Dokploy installed on a VPS (see [Dokploy docs](https://docs.dokploy.com))
- DNS A records pointing to the server IP — see [`../overview.md`](../overview.md)
- GitHub Personal Access Token with `read:packages` scope (for GHCR pulls)
- All secrets and env values from `.env.prod.example` ready to fill in

## 1. Add GHCR Registry

Dokploy needs credentials to pull private images from GHCR.

Settings → Registry → New Registry:

| Field    | Value                              |
| -------- | ---------------------------------- |
| Provider | `ghcr.io`                          |
| Username | `sidarth-g`                        |
| Password | GitHub PAT (`read:packages` scope) |

## 2. Create Project and Compose Service

1. New Project → name it (e.g. `sidshub`)
2. Add Service → **Docker Compose**
3. Source → GitHub, select this repository
4. Compose file path: `docker-compose.prod.yml`

## 3. Set Environment Variables

Open the **Environment** tab of the compose service.

Copy `.env.prod.example`, fill in all values, and paste the contents in.

The following variables are **not required** — they are hardcoded in
`docker-compose.prod.yml` because they are determined by the compose topology:

| Variable       | Hardcoded value                   |
| -------------- | --------------------------------- |
| `DATABASE_URI` | `mongodb://mongodb:27017/payload` |
| `S3_ENDPOINT`  | `http://minio:9000`               |
| `NODE_ENV`     | `production`                      |
| `HOST`         | `0.0.0.0`                         |
| `PORT`         | `4321`                            |

## 4. Configure Domains

Open the **Domains** tab and add:

| Domain           | Service       | Container Port | HTTPS         |
| ---------------- | ------------- | -------------- | ------------- |
| `cms.sidshub.in` | `payload-cms` | `3000`         | Let's Encrypt |
| `www.sidshub.in` | `astro-web`   | `4321`         | Let's Encrypt |
| `sidshub.in`     | `astro-web`   | `4321`         | Let's Encrypt |

Dokploy injects Traefik labels automatically — nothing to add in
`docker-compose.prod.yml`.

After saving, **redeploy** the compose service for domain changes to take effect.

## 5. Enable Auto Deploy

Enable **Auto Deploy** on the compose service. Copy the generated webhook URL and
set it as `WEB_DEPLOY_WEBHOOK_URL` in the environment variables from step 3.

This webhook is called by the CMS `afterChange` hook whenever content is
published, triggering a redeploy that picks up the latest web image.

## 6. Deploy

Click **Deploy**. On the first deployment `astro-web` will fail to start — the
web image does not exist in GHCR yet. This is expected and does not affect the
CMS. Follow the **Bootstrap** section in [`../overview.md`](../overview.md) to
complete the initial setup.

## Rollback

Change `IMAGE_TAG` in the Environment tab to a SHA tag (e.g. `sha-abc1234`) and
redeploy. SHA tags are immutable; they are published for every push to `main` and
`staging` by the CI pipeline.

## Scheduled Media Cleanup

Add a scheduled job in Dokploy (or host cron):

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| Schedule | `0 3 * * *`                                   |
| Command  | `bun run --filter @sidshub/cms cleanup:media` |

First run (dry):
`MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`
