# syntax=docker/dockerfile:1.10

FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Prune the dependency graph to this app and its workspace dependencies.
FROM base AS pruner
COPY . .
RUN bunx turbo prune @sidshub/web --docker

# Install only dependencies (no scripts)
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --ignore-scripts

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --ignore-scripts
ARG ASTRO_SITE_URL
ARG PAYLOAD_PUBLIC_SERVER_URL
ENV ASTRO_SITE_URL=${ASTRO_SITE_URL}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
RUN --mount=type=secret,id=PAYLOAD_API_KEY,env=PAYLOAD_API_KEY \
  --mount=type=cache,id=sidshub-turbo-web,target=/app/.turbo \
  ./node_modules/.bin/turbo run build --filter=@sidshub/web

# Runtime stage (Bun alpine, non-root)
FROM oven/bun:1.3.6-alpine AS runtime
WORKDIR /app
# bun:bun (1000:1000) is already present in the bun alpine image
RUN chown bun:bun /app
# Production-only install — excludes devDeps (eslint, dev-config, daisyui…)
COPY --from=pruner --chown=bun:bun /app/out/json/ .
COPY --from=pruner --chown=bun:bun /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --production --ignore-scripts
# Workspace package dist outputs needed by server-rendered routes at runtime
COPY --from=builder --chown=bun:bun /app/packages/icon-catalog/dist ./packages/icon-catalog/dist
# Built app
COPY --from=builder --chown=bun:bun /app/apps/web/dist ./apps/web/dist
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["bun", "--no-install", "./apps/web/dist/server/entry.mjs"]
