import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import qwikdev from "@qwikdev/astro";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
const siteUrl = process.env.ASTRO_SITE_URL || "http://localhost:4321";

export default defineConfig({
  site: siteUrl,
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap(), qwikdev({ include: "**/qwik/*" })],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@sidshub/icon-catalog", "@sidshub/cms", "payload", "sharp"],
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@cms": fileURLToPath(new URL("../cms/src", import.meta.url)),
      },
    },
  },
});
