import { defineConfig, envField } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://www.sidshub.in",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [mdx(), sitemap()],
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
