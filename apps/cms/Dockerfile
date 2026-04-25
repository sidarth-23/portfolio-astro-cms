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
ARG PAYLOAD_SECRET
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG DATABASE_URI
ARG CMS_READ_TOKEN
ARG RESEND_API_KEY
ARG EMAIL_FROM_ADDRESS
ARG EMAIL_FROM_NAME
ARG S3_BUCKET
ARG S3_REGION
ARG S3_ENDPOINT
ARG S3_ACCESS_KEY_ID
ARG S3_SECRET_ACCESS_KEY
ARG WEB_DEPLOY_WEBHOOK_URL
ARG WEB_DEPLOY_BRANCH
ARG SITE_BUILD_HOOK_TYPE
ARG SITE_BUILD_HOOK_URL
ARG SITE_BUILD_HOOK_SECRET
ARG SITE_BUILD_HOOK_DOKPLOY_APP_ID
ARG SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV DATABASE_URI=${DATABASE_URI}
ENV CMS_READ_TOKEN=${CMS_READ_TOKEN}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
ENV EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
ENV S3_BUCKET=${S3_BUCKET}
ENV S3_REGION=${S3_REGION}
ENV S3_ENDPOINT=${S3_ENDPOINT}
ENV S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
ENV S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
ENV WEB_DEPLOY_WEBHOOK_URL=${WEB_DEPLOY_WEBHOOK_URL}
ENV WEB_DEPLOY_BRANCH=${WEB_DEPLOY_BRANCH}
ENV SITE_BUILD_HOOK_TYPE=${SITE_BUILD_HOOK_TYPE}
ENV SITE_BUILD_HOOK_URL=${SITE_BUILD_HOOK_URL}
ENV SITE_BUILD_HOOK_SECRET=${SITE_BUILD_HOOK_SECRET}
ENV SITE_BUILD_HOOK_DOKPLOY_APP_ID=${SITE_BUILD_HOOK_DOKPLOY_APP_ID}
ENV SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID=${SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID}
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
