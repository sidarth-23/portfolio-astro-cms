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
      "src/ui.ts",
      "src/deploymentStatus.ts",
      "src/DeploymentStatusCard.tsx",
    ],
  }),
);
