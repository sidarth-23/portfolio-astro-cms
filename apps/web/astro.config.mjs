import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

const siteUrl = process.env.ASTRO_SITE_URL ?? "http://localhost:4321";

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
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
        optional: true,
      }),
      ASTRO_CMS_HEALTH_TIMEOUT_MS: envField.number({
        context: "server",
        access: "public",
        int: true,
        min: 1,
        default: 5000,
      }),
    },
  },
});
