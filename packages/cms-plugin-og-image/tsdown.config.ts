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
      "src/generateOgImages.ts",
      "src/OgGeneratorCard.tsx",
      "src/seo/SocialCardPreview.tsx",
      "src/seo/SeoAwareButtons.tsx",
      "src/seo/SeoConfirmModal.tsx",
      "src/computeSeoCheck.ts",
      "src/seoFieldMapping.ts",
    ],
    external: ["node:path", "node:url", "path", "url", "fs/promises", "sharp", "qs-esm"],
  }),
);
