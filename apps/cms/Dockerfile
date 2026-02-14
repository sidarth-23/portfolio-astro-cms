FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/cms/package.json ./apps/cms/package.json
RUN bun install

COPY apps/cms ./apps/cms
WORKDIR /app/apps/cms

EXPOSE 3000
CMD ["bun", "run", "dev"]
