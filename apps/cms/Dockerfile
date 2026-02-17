FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/cms-config/package.json ./packages/cms-config/package.json
COPY packages/lexical/package.json ./packages/lexical/package.json
COPY apps/cms/package.json ./apps/cms/package.json
RUN bun install

FROM node:22-alpine AS builder
WORKDIR /app

# Copy workspace dependencies resolved in deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY apps/cms ./apps/cms
COPY packages/cms-config ./packages/cms-config
COPY packages/lexical ./packages/lexical

WORKDIR /app/apps/cms
ENV NODE_ENV=production
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY apps/cms ./apps/cms
COPY packages/cms-config ./packages/cms-config
COPY packages/lexical ./packages/lexical
COPY --from=builder /app/apps/cms/.next ./apps/cms/.next

WORKDIR /app/apps/cms
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]
