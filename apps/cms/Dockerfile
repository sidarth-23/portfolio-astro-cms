FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/cms-types/package.json ./packages/cms-types/package.json
COPY packages/lexical/package.json ./packages/lexical/package.json
COPY apps/cms/package.json ./apps/cms/package.json
RUN bun install

FROM node:22-alpine AS runtime
WORKDIR /app

# Copy workspace dependencies resolved in deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY apps/cms ./apps/cms
COPY packages/cms-types ./packages/cms-types
COPY packages/lexical ./packages/lexical

WORKDIR /app/apps/cms

EXPOSE 3000
CMD ["npm", "run", "dev"]
