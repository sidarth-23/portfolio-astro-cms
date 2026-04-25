# Custom Deployment (Manual Docker Compose)

This guide covers running the production stack directly on a server without a
managed deployment platform. You are responsible for the reverse proxy, SSL
certificates, and deploy automation.

## Prerequisites

- A Linux server with Docker and Docker Compose installed
- Ports 80 and 443 open
- DNS A records pointing to the server — see [`../overview.md`](../overview.md)
- A reverse proxy managing HTTPS (Traefik, nginx, Caddy, etc.)

## 1. Prepare the Server

Clone the repository:

```bash
git clone https://github.com/sidarth-g/sidshub.git
cd sidshub
```

## 2. Configure Environment Variables

The CMS and Web stacks each read their own `.env` file. Create both from the example:

```bash
# CMS stack — fill in the CMS section of .env.prod.example
cp .env.prod.example deployment/cms/.env

# Web stack — fill in the Web section of .env.prod.example
cp .env.prod.example deployment/web/.env
```

Edit each file and remove the variables that don't belong to it
(see `.env.prod.example` for the section labels).

**Key notes:**

- `ASTRO_CMS_READ_TOKEN` in `deployment/web/.env` must match `CMS_READ_TOKEN` in `deployment/cms/.env`.
- `ASTRO_CMS_API_URL` must be the externally-reachable URL of the CMS
  (e.g. `https://cms.sidshub.in/api`). The web image build runs on the host and cannot
  reach Docker-internal service names.
- Compose-determined values (`DATABASE_URI`, `S3_ENDPOINT`, `NODE_ENV`, `HOST`, `PORT`)
  are hardcoded in the compose files — leave them out of `.env`.

## 3. Create the Shared Docker Network

The CMS and Web stacks run in separate compose projects. Your reverse proxy needs to
reach both `payload-cms` and `astro-web`. Create a shared external network once:

```bash
docker network create webproxy
```

Both compose files already declare `webproxy` as an external network and attach the
app services to it. Attach your reverse proxy container to the same network.

## 4. Configure the Reverse Proxy

`deployment/cms/docker-compose.yml` and `deployment/web/docker-compose.yml` do not include
any Traefik labels or exposed ports. Route traffic to the containers via your reverse proxy.

**Container names and ports**:

| Service       | Internal port |
| ------------- | ------------- |
| `payload-cms` | `3000`        |
| `astro-web`   | `4321`        |

**Example: Caddy** (`/etc/caddy/Caddyfile`):

```caddyfile
cms.sidshub.in {
  reverse_proxy payload-cms:3000
}

www.sidshub.in, sidshub.in {
  reverse_proxy astro-web:4321
}
```

Caddy handles HTTPS automatically via Let's Encrypt. Add the `webproxy` network to
your Caddy compose service:

```yaml
# caddy/docker-compose.yml
networks:
  webproxy:
    external: true
```

## 5. Bootstrap (First Deployment)

The web app fetches all page content from the CMS at build time (SSG). The CMS must be
running and seeded before the web image can be built successfully.

**Step 1 — Start the CMS stack:**

```bash
docker compose -f deployment/cms/docker-compose.yml up -d
```

**Step 2 — Seed the CMS.** Access the CMS admin URL, create an admin account, and add
content for all pages (home, projects, blog, CV, site-settings).

**Step 3 — Build and start the web app:**

```bash
docker compose -f deployment/web/docker-compose.yml build
docker compose -f deployment/web/docker-compose.yml up -d
```

`ASTRO_CMS_READ_TOKEN` is passed as a Docker build arg and used only during the build
step. It is not stored in the resulting image or any registry.

## 6. Keeping Up to Date

**CMS** — pull the latest GHCR image and restart:

```bash
docker compose -f deployment/cms/docker-compose.yml pull payload-cms
docker compose -f deployment/cms/docker-compose.yml up -d payload-cms
```

**Web** — rebuild from source (fetches the latest content from the CMS):

```bash
docker compose -f deployment/web/docker-compose.yml build
docker compose -f deployment/web/docker-compose.yml up -d
```

Automate web rebuilds by wiring `WEB_DEPLOY_WEBHOOK_URL` (in `deployment/cms/.env`) to
a script on the server that runs the commands above.

## 7. Rollback

**CMS:** Set `IMAGE_TAG` in `deployment/cms/.env` to a specific SHA tag and redeploy:

```bash
# deployment/cms/.env
IMAGE_TAG=sha-abc1234

docker compose -f deployment/cms/docker-compose.yml up -d payload-cms
```

**Web:** Check out the previous commit and rebuild:

```bash
git checkout <previous-commit>
docker compose -f deployment/web/docker-compose.yml build
docker compose -f deployment/web/docker-compose.yml up -d
```

## 8. Scheduled Media Cleanup

Add a cron job on the host or run it manually inside the CMS container:

```bash
# Dry run first
docker compose -f deployment/cms/docker-compose.yml exec payload-cms \
  sh -c "MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media"

# Live run (daily at 3 AM via cron)
# 0 3 * * * docker compose -f /path/to/deployment/cms/docker-compose.yml exec -T payload-cms \
#   bun run --filter @sidshub/cms cleanup:media
```
