import type { UserConfig } from "tsdown";

const baseTsdownConfig: UserConfig = {
  format: "esm",
  dts: true,
  outDir: "dist",
  unbundle: true,
  minify: true,
  fixedExtension: true,
  platform: "neutral",
  skipNodeModulesBundle: true,
};

export { baseTsdownConfig };
