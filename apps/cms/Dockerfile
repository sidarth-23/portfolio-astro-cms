# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Prune the dependency graph to this app and its workspace dependencies.
FROM base AS pruner
COPY . .
RUN bunx turbo prune @sidshub/cms --docker

# Install only dependencies (no scripts)
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --ignore-scripts

# App build stage (Node.js + bun for turbo)
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=base /usr/local/bin/bun /usr/local/bin/bun
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
ENV NODE_ENV=production
RUN --mount=type=cache,id=sidshub-turbo-cms,target=/app/.turbo ./node_modules/.bin/turbo run build --filter=@sidshub/cms...
# Remove build cache — not needed at runtime and accounts for ~633 MB
RUN rm -rf /app/apps/cms/.next/cache

# Runtime stage (Node.js, non-root)
FROM node:22-alpine AS runtime
WORKDIR /app
# Standalone output: self-contained server.js + traced node_modules subset
COPY --from=builder --chown=node:node /app/apps/cms/.next/standalone ./
# Static assets must live alongside the standalone server
COPY --from=builder --chown=node:node /app/apps/cms/.next/static ./apps/cms/.next/static
# Workspace package dist outputs (Payload resolves these at runtime)
COPY --from=builder --chown=node:node /app/packages/dev-config/dist ./packages/dev-config/dist
COPY --from=builder --chown=node:node /app/packages/icon-catalog/dist ./packages/icon-catalog/dist
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
USER node
EXPOSE 3000
CMD ["node", "apps/cms/server.js"]
