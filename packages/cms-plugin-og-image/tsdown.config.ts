import { defineConfig, type InlineConfig, type UserConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig(
  (inlineConfig: InlineConfig): UserConfig => ({
    ...baseTsdownConfig(inlineConfig),
    platform: "neutral",
    entry: ["src/index.ts", "src/plugin/index.ts", "src/types/index.ts", "src/ui/index.ts"],
    copy: [
      {
        from: "src/server/og/fonts/atkinson-regular.woff",
        to: "dist/server/og/fonts/atkinson-regular.woff",
      },
      {
        from: "src/server/og/fonts/atkinson-bold.woff",
        to: "dist/server/og/fonts/atkinson-bold.woff",
      },
    ],
    external: ["node:path", "node:url", "path", "url", "fs/promises", "sharp", "qs-esm"],
  }),
);
