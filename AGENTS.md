# AGENTS.md

> Guidelines for AI coding agents working in this repository.

## Project Overview

Astro 5 static portfolio site with blog (MDX), deployed at `https://www.sidshub.in`.
Stack: **Astro 5.7.5**, **TypeScript (strict)**, **Tailwind CSS v4**, **DaisyUI v5**, **React 19** (available but lightly used).
Package manager: **Bun**.

## Build / Dev / Check Commands

```bash
bun install            # Install dependencies
bun run dev            # Development server (http://localhost:4321)
bun run build          # Type-check + production build (astro check && astro build)
bun run preview        # Preview production build locally
bunx astro check       # Type checking only (standalone)
```

### Testing

There is **no test framework** configured. If you add tests, use **Vitest** (bundled with Astro's Vite).
Add a `vitest.config.ts` and a `"test"` script in `package.json`.

### Linting / Formatting

No ESLint or Prettier config file. `prettier-plugin-astro` is a devDependency. To format:

```bash
bunx prettier --write --plugin prettier-plugin-astro "src/**/*.{astro,ts,tsx,js,mjs,css,md,mdx}"
```

## Project Structure

```
src/
├── components/         # Reusable Astro components (PascalCase)
│   └── cv/             # CV-specific components
├── content/
│   ├── config.ts       # Zod schemas for content collections
│   └── blog/           # MDX blog posts
├── layouts/            # Page layouts (BaseLayout, PostLayout)
├── lib/                # Utility functions (camelCase filenames)
├── pages/              # File-based routing
│   └── blog/           # Blog pages with dynamic routes
├── styles/
│   └── global.css      # Tailwind v4 + DaisyUI plugin config
└── consts.ts           # Global site constants
public/                 # Static assets (images, fonts, favicon)
astro.config.mjs        # Astro + Vite + integrations config
```

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled (`extends: "astro/tsconfigs/strict"`, `strictNullChecks: true`).
- Use `type` keyword for type-only imports: `import { type Foo }` or `import type { Foo }`.
- Derive types from Zod schemas with `z.infer<typeof schema>` — don't duplicate interfaces.
- Prefer explicit types for component props; omit where inference is sufficient.
- **Use semicolons** at the end of statements.
- Prefer **double quotes** for strings. Template literals for interpolation.

### Path Aliases

Use `@/` for imports from `src/`. Do **not** use deep relative paths in new code:

```ts
import BaseLayout from "@/layouts/BaseLayout.astro";
import createSlug from "@/lib/createSlug";
```

### Import Ordering

1. Astro built-ins (`astro:content`, `astro:assets`, `astro:transitions`)
2. Third-party packages (`@astrojs/rss`, `react`, etc.)
3. Local aliases (`@/layouts/...`, `@/components/...`, `@/lib/...`, `@/consts`)

### Naming Conventions

| Item             | Convention          | Example                    |
|------------------|---------------------|----------------------------|
| Astro components | PascalCase `.astro` | `HorizontalCard.astro`     |
| React components | PascalCase `.tsx`   | `Counter.tsx`              |
| Utility files    | camelCase `.ts`     | `createSlug.ts`            |
| Page routes      | lowercase `.astro`  | `projects.astro`, `cv.astro` |
| Global constants | SCREAMING_SNAKE     | `SITE_TITLE`               |
| Local variables  | camelCase           | `sideBarActiveItemID`      |

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

- **Tailwind CSS v4** via `@import "tailwindcss"` in `src/styles/global.css`.
- **DaisyUI v5** component classes (`btn`, `card`, `badge`, `drawer`, etc.).
- Active theme: `abyss` (`data-theme="abyss"` on `<html>`). Available: `light`, `dark`, `abyss`.
- Prefer utility classes over custom CSS.

### Content Collections (Blog)

Posts go in `src/content/blog/` as `.mdx` files. Schema in `src/content/config.ts`:
- **Required**: `title`, `description`, `pubDate`.
- **Optional**: `updatedDate`, `heroImage`, `badge`, `tags` (unique array).
- Slugs auto-generated from titles via `src/lib/createSlug.ts`.

### Error Handling

- Static site — most errors surface at build time.
- Handle missing data with conditional rendering (`&&`).
- Always run `bun run build` after changes to catch errors.
- No hardcoded URLs — use `Astro.url` or `Astro.site` for absolute URLs.

## Key Configuration

| Config           | Value / Location                                   |
|------------------|----------------------------------------------------|
| Site URL         | `https://www.sidshub.in` (in `astro.config.mjs`)  |
| TypeScript       | `tsconfig.json` — strict, `@/*` → `./src/*`       |
| Tailwind         | `src/styles/global.css` (v4 CSS-based config)     |
| DaisyUI themes   | `light` (default), `dark` (prefers-dark), `abyss`  |
| Integrations     | MDX, Sitemap (in `astro.config.mjs`)               |
| Tailwind plugin  | `@tailwindcss/vite` via Vite config                |

## Common Tasks

### Add a blog post

Create `src/content/blog/my-post.mdx`:

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

Create a PascalCase `.astro` file in `src/components/` with a `type Props` block.

## Pre-commit Checklist

1. `bun run build` passes (type-check + build).
2. New code uses the `@/` path alias (not deep relative paths).
3. Blog posts conform to the Zod schema in `src/content/config.ts`.
4. Images in `public/` use descriptive filenames and absolute path references.
