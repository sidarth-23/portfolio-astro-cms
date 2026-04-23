import { defineConfig, type InlineConfig, type UserConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig(
  (inlineConfig: InlineConfig): UserConfig => ({
    ...baseTsdownConfig(inlineConfig),
    platform: "neutral",
    entry: [
      "src/index.ts",
      "src/endpoints.ts",
      "src/plugin.ts",
      "src/types.ts",
      "src/feature/server.ts",
      "src/feature/client.tsx",
    ],
    external: ["qs-esm"],
  }),
);
