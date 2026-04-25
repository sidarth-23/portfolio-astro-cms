FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Prune to minimal workspace
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
ENV SKIP_ENV_VALIDATION=1
RUN ./node_modules/.bin/turbo run build --filter=@sidshub/cms

# Runtime stage (Node.js, non-root)
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=pruner --chown=node:node /app/out/full/ .
COPY --from=builder --chown=node:node /app/apps/cms/.next ./apps/cms/.next
COPY --from=builder --chown=node:node /app/packages/dev-config/dist ./packages/dev-config/dist
COPY --from=builder --chown=node:node /app/packages/cms-core/dist ./packages/cms-core/dist
COPY --from=builder --chown=node:node /app/packages/cms-lib-editor/dist ./packages/cms-lib-editor/dist
COPY --from=builder --chown=node:node /app/packages/cms-lib-icons/dist ./packages/cms-lib-icons/dist
COPY --from=builder --chown=node:node /app/packages/cms-feature-emoji/dist ./packages/cms-feature-emoji/dist
COPY --from=builder --chown=node:node /app/packages/cms-feature-footnotes/dist ./packages/cms-feature-footnotes/dist
COPY --from=builder --chown=node:node /app/packages/cms-feature-markdown-paste/dist ./packages/cms-feature-markdown-paste/dist
COPY --from=builder --chown=node:node /app/packages/cms-plugin-deployment-log-view/dist ./packages/cms-plugin-deployment-log-view/dist
COPY --from=builder --chown=node:node /app/packages/cms-plugin-og-image/dist ./packages/cms-plugin-og-image/dist
WORKDIR /app/apps/cms
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
