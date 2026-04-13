# `@sidshub/cms-core`

## `src/lib` architecture

This package uses a responsibility-based `lib` layout:

- `lib/client`: CMS read client domain logic + transport adapters.
- `lib/content`: slug/resume utilities and CMS content option catalogs.
- `lib/icons`: icon parsing/catalog/search helpers (Simple Icons + Phosphor).
- `lib/validation`: Zod primitives, schemas, and Payload validation hooks.
- `lib/og`: OG generation pipeline (rendering, fetchers, templates, fonts).
- `lib/email`: auth email template and render helpers.

## Dependency boundaries

- Import from module barrels (for example `../lib/content`, `../lib/icons`) instead of deep files.
- Avoid cross-module coupling unless there is a clear domain dependency.
- Keep external consumers on package subpath exports (`@sidshub/cms-core/client`, `@sidshub/cms-core/icons`, etc.).

## How to add a new utility

1. Pick the owning module by responsibility first.
2. Add implementation inside that module.
3. Export it from that module's `index.ts` if it is intended for reuse.
4. If needed outside the package, expose it via `package.json` `exports` through a curated subpath.

Do not add new root-level `src/lib/*.ts` utilities; place them in an existing module or create a new module folder with a clear responsibility.
