# syntax=docker/dockerfile:1.7

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
ARG PAYLOAD_SECRET
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG DATABASE_URI
ARG RESEND_API_KEY
ARG EMAIL_FROM_ADDRESS
ARG EMAIL_FROM_NAME
ARG S3_BUCKET
ARG S3_REGION
ARG S3_ENDPOINT
ARG S3_PUBLIC_URL
ARG S3_ACCESS_KEY_ID
ARG S3_SECRET_ACCESS_KEY
ENV ASTRO_SITE_URL=${ASTRO_SITE_URL}
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
ENV EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
ENV S3_BUCKET=${S3_BUCKET}
ENV S3_REGION=${S3_REGION}
ENV S3_ENDPOINT=${S3_ENDPOINT}
ENV S3_PUBLIC_URL=${S3_PUBLIC_URL}
ENV S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
ENV S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
RUN --mount=type=cache,id=sidshub-turbo-web,target=/app/.turbo bunx turbo run build --filter=@sidshub/web...

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
