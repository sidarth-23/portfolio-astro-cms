# AGENTS.md

> Guidelines for AI coding agents working in this repository.

## Project Overview

This is a **public monorepo** for `https://www.sidshub.in`.

- `apps/web`: Astro 5 portfolio + blog frontend (MDX)
- `apps/cms`: Payload CMS backend
- `packages/cms-core`: shared Payload config/types
- `packages/cms-editor`: Lexical rich text editor integration (CMS + web)

Core stack: **Bun workspaces**, **TypeScript (strict)**, **Tailwind CSS v4**, **DaisyUI v5**, **Payload CMS**, **PostgreSQL**, **MinIO**.

## Build / Dev / Check Commands

```bash
bun install            # Install dependencies
bun run dev            # Alias for web dev
bun run dev:web        # Astro web dev server (http://localhost:4321)
bun run dev:cms        # Payload CMS dev server
bun run build          # Build web + cms
bun run build:web      # Build web only
bun run build:cms      # Build cms only
bun run check:web      # Astro type checking only
bun run payload:types  # Generate Payload types
```

### Infrastructure commands

Use Taskfile where possible:

```bash
task up:build          # Build and start Postgres + MinIO + CMS
task down              # Stop local services
task logs              # Follow logs
task logs:cms          # Follow CMS logs
task db:reset          # Reset local DB
```

### Testing

There is **no test framework** configured. If you add tests, use **Vitest** (bundled with Astro's Vite).
Add a `vitest.config.ts` and a `"test"` script in `package.json`.

### Linting / Formatting

ESLint is configured via `@sidshub/dev-config` (shared package). Prettier is configured at the root (`.prettierrc`).

```bash
bun run lint          # Run ESLint across all workspaces
bun run lint:fix      # Auto-fix ESLint issues
bun run format        # Format all files with Prettier
bun run format:check  # Check formatting without writing
```

## Project Structure

```
apps/
├── web/
│   ├── src/
│   │   ├── components/
│   │   ├── content/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   ├── public/
│   ├── astro.config.mjs
│   └── package.json
├── cms/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
packages/
├── cms-core/
│   └── src/payload-types.ts
└── cms-editor/
```

## Public Repo Safety Rules

- Never commit secrets, tokens, `.env` files, or credentials.
- Treat all logs/output as potentially public when writing docs/PR text.
- Do not add hardcoded private URLs, account IDs, or access keys.

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled (`extends: "astro/tsconfigs/strict"`, `strictNullChecks: true`).
- Use `type` keyword for type-only imports: `import { type Foo }` or `import type { Foo }`.
- Derive types from Zod schemas with `z.infer<typeof schema>` — don't duplicate interfaces.
- Prefer explicit types for component props; omit where inference is sufficient.
- **Use semicolons** at the end of statements.
- Prefer **double quotes** for strings. Template literals for interpolation.

### Path Aliases

In `apps/web`, use `@/` for imports from `apps/web/src/`. Do **not** use deep relative paths in new code:

```ts
import BaseLayout from "@/layouts/BaseLayout.astro";
import createSlug from "@/lib/createSlug";
```

For CMS code, follow existing import style in `apps/cms` and prefer local consistency.

### Import Ordering

1. Astro built-ins (`astro:content`, `astro:assets`, `astro:transitions`)
2. Third-party packages (`@astrojs/rss`, `react`, etc.)
3. Local aliases (`@/layouts/...`, `@/components/...`, `@/lib/...`, `@/consts`)

### Naming Conventions

| Item             | Convention          | Example                      |
| ---------------- | ------------------- | ---------------------------- |
| Astro components | PascalCase `.astro` | `HorizontalCard.astro`       |
| React components | PascalCase `.tsx`   | `Counter.tsx`                |
| Utility files    | camelCase `.ts`     | `createSlug.ts`              |
| Page routes      | lowercase `.astro`  | `projects.astro`, `cv.astro` |
| Global constants | SCREAMING_SNAKE     | `SITE_TITLE`                 |
| Local variables  | camelCase           | `sideBarActiveItemID`        |

### Component Props & Structure

Define props with `type Props` (preferred) and destructure with defaults:

```astro
---
type Props = { title: string; img?: string; desc: string };
const { title, img, desc } = Astro.props;
---
```

Astro component order: **frontmatter** (`---`) → **template** (HTML + `<slot />`) → **`<style>`** (optional, prefer Tailwind).

### Styling

- **Tailwind CSS v4** via `@import "tailwindcss"` in `apps/web/src/styles/global.css`.
- **DaisyUI v5** component classes (`btn`, `card`, `badge`, `drawer`, etc.).
- Active theme: `abyss` (`data-theme="abyss"` on `<html>`). Available: `light`, `dark`, `abyss`.
- Prefer utility classes over custom CSS.

### Content Collections (Blog)

Posts go in `apps/web/src/content/blog/` as `.mdx` files. Schema in `apps/web/src/content/config.ts`:

- **Required**: `title`, `description`, `pubDate`.
- **Optional**: `updatedDate`, `heroImage`, `badge`, `tags` (unique array).
- Slugs auto-generated from titles via `apps/web/src/lib/createSlug.ts`.

### Payload / CMS

- Prefer updating schema/config in `packages/cms-core` when change should be shared.
- After CMS schema changes, regenerate types with `bun run payload:types`.
- Keep migration behavior aligned with the existing environment strategy in `apps/cms/README.md`.

### Error Handling

- Web errors usually surface at build time (`bun run check:web`, `bun run build:web`).
- Handle missing data with conditional rendering (`&&`) and safe null checks.
- For cross-app changes, run `bun run build` before finishing.
- No hardcoded URLs; use app config/environment values.

## Key Configuration

| Config          | Value / Location                                       |
| --------------- | ------------------------------------------------------ |
| Site URL        | `https://www.sidshub.in` (`apps/web/astro.config.mjs`) |
| TypeScript      | strict mode in app-level configs                       |
| Tailwind        | `apps/web/src/styles/global.css` (v4 CSS config)       |
| DaisyUI themes  | `light` (default), `dark` (prefers-dark), `abyss`      |
| Integrations    | MDX, Sitemap (web app)                                 |
| Tailwind plugin | `@tailwindcss/vite` via Vite config (web app)          |

## Common Tasks

### Add a blog post

Create `apps/web/src/content/blog/my-post.mdx`:

```mdx
---
title: "Post Title"
description: "Short description"
pubDate: "2026-02-14"
heroImage: "/blog/my-image.jpg"
tags: ["astro", "web"]
---

Content here...
```

### Add a page

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
---

<BaseLayout title="Page Title" sideBarActiveItemID="pagename">
  <!-- content -->
</BaseLayout>
```

### Add a component

Create a PascalCase `.astro` file in `apps/web/src/components/` with a `type Props` block.

## Pre-commit Checklist

1. Relevant checks/builds pass (`bun run build:web`, `bun run build:cms`, or `bun run build` for cross-app changes).
2. New web code uses `@/` alias; avoid deep relative imports.
3. Blog posts conform to schema in `apps/web/src/content/config.ts`.
4. Never commit secrets (`.env`, tokens, credentials).
5. If CMS schema changed, regenerate types with `bun run payload:types`.
