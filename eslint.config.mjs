import astroConfig from "@sidshub/eslint-config/astro";
import baseConfig from "@sidshub/eslint-config";

/**
 * Root ESLint flat config for the monorepo.
 *
 * Used by lint-staged (which runs ESLint from the workspace root).
 * Per-package configs in apps/ and packages/ apply additional rules
 * (e.g. Next.js core-web-vitals) when ESLint is run per-project via turbo.
 */
export default [
  // Astro rules scoped to the web app only
  ...astroConfig.map((cfg) => ({
    ...cfg,
    files: cfg.files ? cfg.files.map((f) => `apps/web/${f}`) : ["apps/web/**/*.astro"],
  })),
  // Base TS/JS rules for all workspace source files
  ...baseConfig.map((cfg) => ({
    ...cfg,
    ...(cfg.files ? { files: cfg.files.map((f) => `{apps,packages}/**/${f}`) } : {}),
  })),
  // Root-level ignores
  {
    ignores: [
      "**/dist/",
      "**/.next/",
      "**/.astro/",
      "**/node_modules/",
      "**/*.generated.*",
      "**/payload-types.ts",
      "**/payload-generated-schema.ts",
      "**/importMap.js",
    ],
  },
];
