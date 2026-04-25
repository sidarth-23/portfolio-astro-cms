# Dokploy Setup

This guide covers deploying the production stack on Dokploy using the included
templates, which auto-generate secrets and assign Traefik domains.

The CMS and Web are deployed as **two separate Dokploy apps** inside the same project.
This mirrors the split compose file structure and lets each app be redeployed independently.

## Prerequisites

- Dokploy installed on a VPS (see [Dokploy docs](https://docs.dokploy.com))
- DNS A records pointing to the server IP — see [`../overview.md`](../overview.md)
- GitHub Personal Access Token with `read:packages` scope (for GHCR pulls of the CMS image)

## 1. Add GHCR Registry

Dokploy needs credentials to pull the CMS image from GHCR.

Settings → Registry → New Registry:

| Field    | Value                              |
| -------- | ---------------------------------- |
| Provider | `ghcr.io`                          |
| Username | `sidarth-g`                        |
| Password | GitHub PAT (`read:packages` scope) |

> The web app image is **not** in GHCR — it is built locally by Dokploy from source
> using the `build:` directive in `deployment/dokploy/web/docker-compose.yml`.

## 2. Create Project and Two Compose Services

1. **New Project** → name it (e.g. `sidshub`)

2. **Add Service → Docker Compose** → name it `cms`

   - Source → GitHub, select this repository
   - Compose file path: `deployment/dokploy/cms/docker-compose.yml`

3. **Add Service → Docker Compose** → name it `web`
   - Source → GitHub, select this repository
   - Compose file path: `deployment/dokploy/web/docker-compose.yml`

## 3. Apply the Templates

### CMS App

Open the **Environment** tab of the `cms` compose service. Paste the contents of
`deployment/dokploy/cms/template.toml` into the template field. Dokploy resolves all
`${...}` generators:

| Variable                    | How it's set                                    |
| --------------------------- | ----------------------------------------------- |
| `PAYLOAD_SECRET`            | Auto — `openssl rand -base64 32`                |
| `CMS_READ_TOKEN`            | Auto — `openssl rand -base64 32`                |
| `S3_ACCESS_KEY_ID`          | Auto — random 20-char alphanumeric              |
| `S3_SECRET_ACCESS_KEY`      | Auto — random 40-char alphanumeric              |
| `PAYLOAD_PUBLIC_SERVER_URL` | Auto — derived from CMS domain                  |
| `ASTRO_SITE_URL`            | **Manual — fill with the web app's public URL** |
| `RESEND_API_KEY`            | **Manual — fill before deploying**              |
| `EMAIL_FROM_ADDRESS`        | **Manual — fill before deploying**              |
| `EMAIL_FROM_NAME`           | **Manual — fill before deploying**              |

The CMS will refuse to start if the three email values are left empty — fill them in the
Environment tab before clicking Deploy.

### Web App

Open the **Environment** tab of the `web` compose service. Paste the contents of
`deployment/dokploy/web/template.toml` into the template field:

| Variable               | How it's set                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `ASTRO_SITE_URL`       | Auto — derived from web domain                                         |
| `ASTRO_CMS_API_URL`    | **Manual — fill with the CMS public URL + `/api`**                     |
| `ASTRO_CMS_READ_TOKEN` | **Manual — copy the value of `CMS_READ_TOKEN` from the CMS app's env** |

**Security note:** `ASTRO_CMS_READ_TOKEN` is a Docker build arg consumed during the Astro
SSG build step. It is never stored in a registry image or exposed publicly.

## 4. Configure Domains

Each app has its own **Domains** tab.

**CMS app:**

| Service       | Container Port | Domain                       |
| ------------- | -------------- | ---------------------------- |
| `payload-cms` | `3000`         | auto-assigned `*.traefik.me` |

**Web app:**

| Service     | Container Port | Domain                       |
| ----------- | -------------- | ---------------------------- |
| `astro-web` | `4321`         | auto-assigned `*.traefik.me` |

Dokploy injects Traefik labels automatically — nothing to add in the compose files.

### Using Custom Domains

To use real domains instead of the auto-assigned `*.traefik.me` ones:

1. Replace the domain entries in each app's **Domains** tab with your real hostnames
   and enable HTTPS via Let's Encrypt.
2. Update the corresponding environment variables in each app:

   **CMS app:**

   - `PAYLOAD_PUBLIC_SERVER_URL` → `https://cms.yourdomain.com`
   - `ASTRO_SITE_URL` → `https://www.yourdomain.com`

   **Web app:**

   - `ASTRO_SITE_URL` → `https://www.yourdomain.com`
   - `ASTRO_CMS_API_URL` → `https://cms.yourdomain.com/api`

After saving domain and environment changes, **redeploy** each app for them to take effect.

## 5. Bootstrap (First Deployment)

The web app fetches all page content from the live CMS API at build time (SSG).
The CMS must be running and seeded before the web app can be deployed successfully.

1. **Deploy the CMS app first.** Click **Deploy** on the `cms` service. MongoDB, MinIO,
   and the CMS will start. Leave the `web` app undeployed for now.

2. **Access the CMS admin URL**, create an admin account, and seed all required content
   (home page, projects, blog posts, CV, site-settings).

3. **Set `ASTRO_CMS_API_URL`** and **`ASTRO_CMS_READ_TOKEN`** on the `web` app in
   the Environment tab (copy `CMS_READ_TOKEN` from the CMS app).

4. **Deploy the web app.** Dokploy will build the web image — the CMS is now reachable
   and the build will succeed.

## 6. Enable Auto Deploy and Webhook

1. Enable **Auto Deploy** on the **web** app. Copy the generated webhook URL.
2. Paste the webhook URL into the **CMS** app's `WEB_DEPLOY_WEBHOOK_URL` environment variable.
3. Redeploy the CMS app to apply the change.

The CMS `afterChange` hook POSTs to `WEB_DEPLOY_WEBHOOK_URL` whenever content is published.
Dokploy will rebuild the `astro-web` image with fresh CMS content and restart the container.

## Rollback

**CMS:** Change `IMAGE_TAG` in the CMS app's Environment tab to a SHA tag (e.g. `sha-abc1234`)
and redeploy. SHA tags are immutable and published for every CMS push to `main`
and `staging` by the CI pipeline.

**Web:** Check out the previous commit in the Dokploy source settings (or force-push
the desired state to the branch) and redeploy. The image will be rebuilt from source.

## Scheduled Media Cleanup

Add a scheduled job in Dokploy (or host cron) targeting the **CMS** app:

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| Schedule | `0 3 * * *`                                   |
| Command  | `bun run --filter @sidshub/cms cleanup:media` |

First run (dry):
`MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media`
