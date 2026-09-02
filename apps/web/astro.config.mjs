import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import qwikdev from "@qwikdev/astro";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const loadedEnv = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");

const siteUrl = loadedEnv.ASTRO_SITE_URL || process.env.ASTRO_SITE_URL || "http://localhost:4321";

export default defineConfig({
  env: {
    schema: {
      PAYLOAD_PUBLIC_SERVER_URL: envField.string({ context: "server", access: "public" }),
      PAYLOAD_API_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
  site: siteUrl,
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [sitemap(), qwikdev({ include: "**/qwik/*" })],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@sidshub/icon-catalog"],
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
