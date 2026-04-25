import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["eslint/index.ts", "tsdown/index.ts"],
  format: "esm",
  dts: true,
  outDir: "dist",
  unbundle: true,
  fixedExtension: true,
  skipNodeModulesBundle: true,
});
