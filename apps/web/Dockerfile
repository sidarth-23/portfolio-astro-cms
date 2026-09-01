FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Prune the dependency graph to this app and its workspace dependencies.
FROM base AS pruner
COPY . .
RUN bunx turbo prune @sidshub/web --docker

# Install only dependencies (no scripts)
FROM base AS deps
COPY --from=pruner /app/out/json/ .
RUN bun install --frozen-lockfile --ignore-scripts

# App build stage (Bun)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
ARG ASTRO_SITE_URL
ARG ASTRO_CMS_API_URL
ARG ASTRO_CMS_READ_TOKEN
ENV ASTRO_SITE_URL=${ASTRO_SITE_URL}
ENV ASTRO_CMS_API_URL=${ASTRO_CMS_API_URL}
ENV ASTRO_CMS_READ_TOKEN=${ASTRO_CMS_READ_TOKEN}
# Changing this value busts the Docker layer cache for this stage only (base/pruner/deps stay cached).
# Updated automatically by the CMS deploy hook on content changes via the Dokploy API.
ARG CACHE_BUST
RUN echo "cache-bust: ${CACHE_BUST}" && bunx turbo run build --filter=@sidshub/web...

# Runtime stage (Bun alpine, non-root)
FROM oven/bun:1.3.6-alpine AS runtime
WORKDIR /app
# bun:bun (1000:1000) is already present in the bun alpine image
RUN chown bun:bun /app
# Production-only install — excludes devDeps (faker, eslint, dev-config, daisyui…)
COPY --from=pruner --chown=bun:bun /app/out/json/ .
COPY --from=pruner --chown=bun:bun /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --production --ignore-scripts
# Workspace package dist outputs needed by server-rendered routes at runtime
COPY --from=builder --chown=bun:bun /app/packages/cms-core/dist ./packages/cms-core/dist
COPY --from=builder --chown=bun:bun /app/packages/cms-lib-editor/dist ./packages/cms-lib-editor/dist
COPY --from=builder --chown=bun:bun /app/packages/cms-lib-icons/dist ./packages/cms-lib-icons/dist
# Built app
COPY --from=builder --chown=bun:bun /app/apps/web/dist ./apps/web/dist
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["bun", "--no-install", "./apps/web/dist/server/entry.mjs"]
