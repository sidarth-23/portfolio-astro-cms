FROM oven/bun:1.3.6 AS base
WORKDIR /app

FROM base AS pruner
COPY . .
RUN bunx turbo prune @sidshub/cms --docker

FROM base AS deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace dependencies resolved in deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .

WORKDIR /app/apps/cms
ENV NODE_ENV=production
ARG PAYLOAD_SECRET
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG RESEND_API_KEY
ARG EMAIL_FROM_ADDRESS
ARG EMAIL_FROM_NAME
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
ENV EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=pruner --chown=node:node /app/out/full/ .
COPY --from=builder --chown=node:node /app/apps/cms/.next ./apps/cms/.next

WORKDIR /app/apps/cms
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
