# Dokploy Setup

This guide covers deploying the production stack on Dokploy using the included
template, which auto-generates secrets and assigns Traefik domains.

## Prerequisites

- Dokploy installed on a VPS (see [Dokploy docs](https://docs.dokploy.com))
- DNS A records pointing to the server IP — see [`../overview.md`](../overview.md)
- GitHub Personal Access Token with `read:packages` scope (for GHCR pulls)

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
4. Compose file path: `deployment/dokploy/docker-compose.yml`

## 3. Apply the Template

Open the **Environment** tab of the compose service.

Paste the contents of `deployment/dokploy/template.toml` into the template
field (or use Dokploy's blueprint import if available). Dokploy resolves all
`${...}` generators and writes the result to the service's environment:

| Variable                    | How it's set                            |
| --------------------------- | --------------------------------------- |
| `PAYLOAD_SECRET`            | Auto — `openssl rand -base64 32`        |
| `CMS_READ_TOKEN`            | Auto — `openssl rand -base64 32`        |
| `ASTRO_CMS_READ_TOKEN`      | Auto — same value as `CMS_READ_TOKEN`   |
| `S3_ACCESS_KEY_ID`          | Auto — random 20-char alphanumeric      |
| `S3_SECRET_ACCESS_KEY`      | Auto — random 40-char alphanumeric      |
| `PAYLOAD_PUBLIC_SERVER_URL` | Auto — derived from CMS domain          |
| `ASTRO_SITE_URL`            | Auto — derived from web domain          |
| `ASTRO_CMS_API_URL`         | Auto — derived from CMS domain + `/api` |
| `RESEND_API_KEY`            | **Manual — fill before deploying**      |
| `EMAIL_FROM_ADDRESS`        | **Manual — fill before deploying**      |
| `EMAIL_FROM_NAME`           | **Manual — fill before deploying**      |

The CMS will refuse to start if the three manual values are left empty — fill
them in the Environment tab before clicking Deploy.

## 4. Configure Domains

Open the **Domains** tab. The template pre-configures two Traefik entries:

| Service       | Container Port | Domain                       |
| ------------- | -------------- | ---------------------------- |
| `payload-cms` | `3000`         | auto-assigned `*.traefik.me` |
| `astro-web`   | `4321`         | auto-assigned `*.traefik.me` |

Dokploy injects Traefik labels automatically — nothing to add in
`deployment/dokploy/docker-compose.yml`.

### Using Custom Domains

To use real domains instead of the auto-assigned `*.traefik.me` ones:

1. Replace the domain entries in the **Domains** tab with your real hostnames
   and enable HTTPS via Let's Encrypt.
2. Update the corresponding environment variables:
   - `PAYLOAD_PUBLIC_SERVER_URL` → `https://cms.yourdomain.com`
   - `ASTRO_SITE_URL` → `https://www.yourdomain.com`
   - `ASTRO_CMS_API_URL` → `https://cms.yourdomain.com/api`

After saving domain changes, **redeploy** for them to take effect.

## 5. Deploy

Click **Deploy**. On the first deployment `astro-web` will fail to start — the
web image does not exist in GHCR yet. This is expected and does not affect the
CMS. Follow the **Bootstrap** section in [`../overview.md`](../overview.md) to
complete the initial setup.

## 6. Enable Auto Deploy

Enable **Auto Deploy** on the compose service. Copy the generated webhook URL
and set it as `WEB_DEPLOY_WEBHOOK_URL` in the Environment tab, then redeploy.

This webhook is called by the CMS `afterChange` hook whenever content is
published, triggering a redeploy that picks up the latest web image.

## Rollback

Change `IMAGE_TAG` in the Environment tab to a SHA tag (e.g. `sha-abc1234`) and
redeploy. SHA tags are immutable and published for every push to `main` and
`staging` by the CI pipeline.

## Scheduled Media Cleanup

Add a scheduled job in Dokploy (or host cron):

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| Schedule | `0 3 * * *`                                   |
| Command  | `bun run --filter @sidshub/cms cleanup:media` |

First run (dry):
`MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`
