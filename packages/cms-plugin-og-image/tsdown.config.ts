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
      "src/OgGeneratorCard.tsx",
      "src/seo/SocialCardPreview.tsx",
      "src/seo/SeoAwareButtons.tsx",
      "src/seo/SeoConfirmModal.tsx",
      "src/endpoints/generate.ts",
      "src/og/iconUtils.ts",
      "src/og/index.ts",
      "src/lib/detectSeo.ts",
      "src/lib/configTransforms.ts",
      "src/lib/seoFieldMapping.ts",
      "src/lib/computeSeoCheck.ts",
    ],
    copy: [
      { from: "src/og/fonts/atkinson-regular.woff", to: "dist/og/fonts/atkinson-regular.woff" },
      { from: "src/og/fonts/atkinson-bold.woff", to: "dist/og/fonts/atkinson-bold.woff" },
    ],
    external: ["node:path", "node:url", "path", "url", "fs/promises", "sharp", "qs-esm"],
  }),
);
