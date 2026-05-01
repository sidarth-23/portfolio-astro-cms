import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { devRefresh } from "./src/integrations/dev-refresh";

const siteUrl = process.env.ASTRO_SITE_URL || "http://localhost:4321";

export default defineConfig({
  site: siteUrl,
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap(), devRefresh()],
  env: {
    schema: {
      ASTRO_CMS_API_URL: envField.string({
        context: "server",
        access: "public",
        url: true,
        default: "http://localhost:3000/api",
      }),
      ASTRO_CMS_READ_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@sidshub/cms-core", "@sidshub/cms-lib-editor", "@sidshub/cms-lib-icons"],
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
