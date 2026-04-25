FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Prune to minimal workspace
FROM base AS pruner
COPY . .
RUN bunx turbo prune @sidshub/web --docker

# Install only dependencies (no scripts)
FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
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
RUN bunx turbo run build --filter=@sidshub/web

# Runtime stage (Bun, non-root)
FROM oven/bun:1.3.6 AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
COPY --from=builder /app/packages/dev-config/dist ./packages/dev-config/dist
COPY --from=builder /app/packages/cms-core/dist ./packages/cms-core/dist
COPY --from=builder /app/packages/cms-lib-editor/dist ./packages/cms-lib-editor/dist
COPY --from=builder /app/packages/cms-lib-icons/dist ./packages/cms-lib-icons/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
# Add non-root user 'node' and set permissions
RUN addgroup -g 1000 node && adduser -D -u 1000 -G node node
RUN chown -R node:node /app
USER node
EXPOSE 4321
CMD ["bun", "--no-install", "./apps/web/dist/server/entry.mjs"]
