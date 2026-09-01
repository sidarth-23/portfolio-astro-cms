import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import qwikdev from "@qwikdev/astro";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const loadedEnv = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");

// Astro loads .env values into import.meta.env, while the shared Payload
// config validates process.env during SSR module evaluation. Preserve values
// already supplied by the shell and fill only missing entries from .env.
for (const [key, value] of Object.entries(loadedEnv)) {
  process.env[key] ??= value;
}

const siteUrl = process.env.ASTRO_SITE_URL || "http://localhost:4321";

export default defineConfig({
  site: siteUrl,
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap(), qwikdev({ include: "**/qwik/*" })],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@sidshub/icon-catalog", "@sidshub/cms", "payload"],
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@cms": fileURLToPath(new URL("../cms/src", import.meta.url)),
      },
    },
  },
});
