import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/payload-types.ts",
    "src/builder.ts",
    "src/lib/client/index.ts",
    "src/lib/client/rest.ts",
    "src/lib/client/mock/index.ts",
    "src/lib/content/index.ts",
    "src/lib/icons/index.ts",
    "src/lib/deployment/index.ts",
    "src/lib/validation/index.ts",
    "src/components/admin/**/*.{ts,tsx}",
    "src/plugin/markdown-paste/client.tsx",
  ],
  format: "esm",
  dts: true,
  outDir: "dist",
  unbundle: true,
  fixedExtension: true,
  platform: "neutral",
  external: ["node:path", "node:url", "path", "url", "fs/promises", "sharp", "qs-esm"],
  skipNodeModulesBundle: true,
  copy: [
    {
      from: "src/styles/admin-overrides.css",
      to: "dist/styles/admin-overrides.css",
    },
  ],
});
