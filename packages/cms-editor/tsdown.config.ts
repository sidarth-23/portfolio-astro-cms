import { defineConfig } from "tsdown";
import { baseTsdownConfig } from "@sidshub/dev-config/tsdown";

export default defineConfig({
  ...baseTsdownConfig,
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
});
