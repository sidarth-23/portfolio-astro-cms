import { defineConfig, type InlineConfig, type UserConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig(
  (inlineConfig: InlineConfig): UserConfig => ({
    ...baseTsdownConfig(inlineConfig),
    platform: "neutral",
    entry: [
      "src/cms.ts",
      "src/web/html/index.ts",
      "src/web/html/client/index.ts",
      "src/web/util/index.ts",
    ],
    copy: [
      {
        from: "src/web/html/styles.css",
        to: "dist/web/html/styles.css",
      },
    ],
  }),
);
