# Custom Deployment (Manual Docker Compose)

Run the complete production stack from the root `docker-compose.yml` on a server with
Docker Compose. You provide the reverse proxy, TLS certificates, and deploy automation.

## Prerequisites

- Linux server with Docker Compose
- Ports 80 and 443 open
- DNS records for the CMS and web hostnames
- Traefik, Caddy, or another reverse proxy

## 1. Prepare and configure

```bash
git clone https://github.com/sidarth-g/sidshub.git
cd sidshub
cp .env.example .env
```

Fill `.env` with production secrets and URLs. `ASTRO_CMS_API_URL` must be reachable
from the server during the Astro build. Never expose MinIO or MongoDB through the reverse proxy.

## 2. Configure the reverse proxy

Route the public hosts directly to the internal service ports:

| Host         | Service            |
| ------------ | ------------------ |
| CMS hostname | `payload-cms:3000` |
| Web hostname | `astro-web:4321`   |

Attach the proxy to the compose network if it runs in Docker. With Caddy, for example:

```caddyfile
cms.example.com {
  reverse_proxy payload-cms:3000
}

www.example.com, example.com {
  reverse_proxy astro-web:4321
}
```

The application services have no host port mappings; the proxy is the only public entry
point. MinIO remains private and Payload mediates media access.

## 3. First deployment

The unified project builds and starts all services together:

```bash
docker compose up -d --build
```

Open the CMS admin and seed required content as needed.

## 4. Updates and rollback

```bash
# Update CMS image
docker compose pull payload-cms
docker compose up -d payload-cms

docker compose up -d --build
```

Set `IMAGE_TAG` to an immutable GHCR tag to roll back the CMS. Check out a previous
source revision and rebuild `astro-web` to roll back the web output.

## 5. Scheduled media cleanup

Run the CMS cleanup command from a scheduler, after a dry run:

```bash
docker compose exec payload-cms bun run --filter @sidshub/cms cleanup:media
```
