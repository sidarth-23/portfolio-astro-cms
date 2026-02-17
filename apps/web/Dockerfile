FROM oven/bun:1 AS builder
WORKDIR /app

# Copy workspace root + package.json files for dependency resolution
COPY package.json bun.lock ./
COPY packages/cms-config/package.json ./packages/cms-config/package.json
COPY packages/lexical/package.json ./packages/lexical/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install

# Copy workspace package sources (needed at build time)
COPY packages/cms-config ./packages/cms-config
COPY packages/lexical ./packages/lexical
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN bun run build

# Runtime — Node.js to run the SSR server
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/apps/web/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
