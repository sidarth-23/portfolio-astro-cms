FROM oven/bun:1.3.6 AS base
WORKDIR /app

FROM base AS pruner
COPY . .
RUN bunx turbo prune @sidshub/web --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/json/bun.lock ./bun.lock
RUN bun install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
ARG ASTRO_SITE_URL
ARG ASTRO_CMS_API_URL
ARG ASTRO_CMS_READ_TOKEN
ARG ASTRO_CMS_HEALTH_TIMEOUT_MS=5000
ENV ASTRO_SITE_URL=${ASTRO_SITE_URL}
ENV ASTRO_CMS_API_URL=${ASTRO_CMS_API_URL}
ENV ASTRO_CMS_READ_TOKEN=${ASTRO_CMS_READ_TOKEN}
ENV ASTRO_CMS_HEALTH_TIMEOUT_MS=${ASTRO_CMS_HEALTH_TIMEOUT_MS}
RUN bunx turbo run build --filter=@sidshub/web

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=installer /app/apps/web/dist/ ./
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
