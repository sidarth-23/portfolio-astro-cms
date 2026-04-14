import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/cms.ts",
    "src/web/html/index.ts",
    "src/web/html/daisyui/index.ts",
    "src/web/html/tailwind/index.ts",
    "src/web/html/client/index.ts",
    "src/web/util/index.ts",
  ],
  format: "esm",
  dts: true,
  outDir: "dist",
  clean: true,
  unbundle: true,
  fixedExtension: true,
  platform: "neutral",
  skipNodeModulesBundle: true,
});
