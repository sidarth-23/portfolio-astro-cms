import { defineConfig, type InlineConfig, type UserConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig(
  (inlineConfig: InlineConfig): UserConfig => ({
    ...baseTsdownConfig(inlineConfig),
    platform: "neutral",
    entry: [
      "src/payload-types.ts",
      "src/builder.ts",
      "src/hooks/deploy-adapters/index.ts",
      "src/lib/client/index.ts",
      "src/lib/client/transport.ts",
      "src/lib/client/media.ts",
      "src/lib/content/index.ts",
      "src/lib/validation/index.ts",
      "src/components/admin/**/*.{ts,tsx}",
    ],
    copy: [
      {
        from: "../cms-plugin-og-image/dist/server/og/fonts/atkinson-regular.woff",
        to: "dist/cms-plugin-og-image/dist/server/og/fonts/atkinson-regular.woff",
      },
      {
        from: "../cms-plugin-og-image/dist/server/og/fonts/atkinson-bold.woff",
        to: "dist/cms-plugin-og-image/dist/server/og/fonts/atkinson-bold.woff",
      },
    ],
    external: ["node:path", "node:url", "path", "url", "fs/promises", "sharp", "qs-esm"],
  }),
);
