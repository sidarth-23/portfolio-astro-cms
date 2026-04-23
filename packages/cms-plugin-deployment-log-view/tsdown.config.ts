import { defineConfig, type InlineConfig, type UserConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig(
  (inlineConfig: InlineConfig): UserConfig => ({
    ...baseTsdownConfig(inlineConfig),
    platform: "neutral",
    entry: [
      "src/index.ts",
      "src/plugin.ts",
      "src/types.ts",
      "src/ui/index.ts",
      "src/endpoints/status.ts",
      "src/adapters/dokploy.ts",
      "src/adapters/registry.ts",
      "src/ui/DeploymentStatusCard.tsx",
    ],
  }),
);
