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

Clone the repository (or copy the relevant files):

```bash
git clone https://github.com/sidarth-g/sidshub.git
cd sidshub
```

## 2. Configure Environment Variables

```bash
cp .env.prod.example .env
```

Fill in all values. The `.env` file is loaded by `deployment/docker-compose.prod.yml` via
`env_file`. Compose-determined values (`DATABASE_URI`, `S3_ENDPOINT`,
`NODE_ENV`, `HOST`, `PORT`) are hardcoded in the compose file — leave them out
of `.env`.

## 3. Configure the Reverse Proxy

`deployment/docker-compose.prod.yml` does not include any Traefik labels or exposed ports.
You need to route traffic to the containers yourself.

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

Caddy handles HTTPS automatically via Let's Encrypt. Attach it to the same
Docker network as the compose stack (see step 4).

**Example: nginx + Certbot** — configure a server block per domain pointing to
the container's host port, or join the proxy to the compose network and proxy by
service name.

## 4. Shared Docker Network

If your reverse proxy runs as a separate container, create a shared network and
attach both the proxy and the compose services to it:

```bash
docker network create webproxy
```

Then in your proxy's compose file:

```yaml
networks:
  webproxy:
    external: true
```

And update `deployment/docker-compose.prod.yml` to add that network to `payload-cms` and
`astro-web`, alongside the existing internal network.

## 5. Deploy

```bash
docker compose -f deployment/docker-compose.prod.yml up -d
```

On first deployment `astro-web` will fail to start — the web image does not yet
exist in GHCR. This is expected. Follow the **Bootstrap** section in
[`../overview.md`](../overview.md) to seed the CMS and trigger the first web
image build.

## 6. Keeping Up to Date

Pull the latest images and restart:

```bash
docker compose -f deployment/docker-compose.prod.yml pull
docker compose -f deployment/docker-compose.prod.yml up -d
```

Automate this by wiring `WEB_DEPLOY_WEBHOOK_URL` to a script on the server, or
set up a cron job to pull and restart on a schedule.

## 7. Rollback

Set `IMAGE_TAG` in `.env` to a specific SHA tag and redeploy:

```bash
# .env
IMAGE_TAG=sha-abc1234

docker compose -f deployment/docker-compose.prod.yml up -d
```

## 8. Scheduled Media Cleanup

Add a cron job on the host or run it manually inside the CMS container:

```bash
# Dry run first
docker compose -f deployment/docker-compose.prod.yml exec payload-cms \
  sh -c "MEDIA_CLEANUP_DRY_RUN=true bun run --filter @sidshub/cms cleanup:media"

# Live run (daily at 3 AM via cron)
# 0 3 * * * docker compose -f /path/to/deployment/docker-compose.prod.yml exec -T payload-cms \
#   bun run --filter @sidshub/cms cleanup:media
```
