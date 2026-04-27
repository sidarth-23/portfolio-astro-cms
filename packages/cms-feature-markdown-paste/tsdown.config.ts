import { defineConfig, type InlineConfig, type UserConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig(
  (inlineConfig: InlineConfig): UserConfig => ({
    ...baseTsdownConfig(inlineConfig),
    platform: "neutral",
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/client.tsx",
      "src/plugin.ts",
      "src/endpoints/index.ts",
    ],
    external: [
      "qs-esm",
      "node:path",
      "node:url",
      "node:fs",
      "node:crypto",
      "path",
      "url",
      "fs",
      "crypto",
    ],
  }),
);
