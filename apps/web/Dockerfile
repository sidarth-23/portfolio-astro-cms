FROM oven/bun:1
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
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321
CMD ["sh", "-c", "bun run build && node ./dist/server/entry.mjs"]
