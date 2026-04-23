import type { InlineConfig, UserConfig } from "tsdown";

function baseTsdownConfig(inlineConfig?: InlineConfig): UserConfig {
  const isWatch = !!inlineConfig?.watch;
  return {
    format: "esm",
    dts: true,
    outDir: "dist",
    unbundle: true,
    minify: !isWatch,
    fixedExtension: true,
    platform: "neutral",
    skipNodeModulesBundle: true,
  };
}

export { baseTsdownConfig };
