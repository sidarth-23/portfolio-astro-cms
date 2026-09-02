import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";
import qwikdev from "@qwik.dev/astro";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const loadedEnv = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");
const isCloudflare = process.env.CF_PAGES === "1" || process.env.DEPLOY_TARGET === "cloudflare";
const environment = { ...loadedEnv, ...process.env };

if (isCloudflare) {
  if (!environment.PAYLOAD_API_KEY) {
    throw new Error("PAYLOAD_API_KEY must be set for a Cloudflare build");
  }
  process.env.ASTRO_SITE_URL ??= environment.ASTRO_SITE_URL || "https://www.sidshub.in";
  process.env.PAYLOAD_PUBLIC_SERVER_URL ??=
    environment.PAYLOAD_PUBLIC_SERVER_URL || "https://cms.sidshub.in";
}

const siteUrl = environment.ASTRO_SITE_URL || "http://localhost:4321";
export default defineConfig({
  env: {
    schema: {
      PAYLOAD_PUBLIC_SERVER_URL: envField.string({ context: "server", access: "public" }),
      PAYLOAD_API_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
  site: siteUrl,
  output: "static",
  compressHTML: true,
  adapter: isCloudflare
    ? cloudflare({
        session: false,
        configPath: "./wrangler.jsonc",
        prerenderEnvironment: "node",
      })
    : node({ mode: "standalone" }),
  integrations: [sitemap(), qwikdev({ include: "**/qwik/*" })],
  vite: {
    plugins: [tailwindcss()],
    define: {
      __EXPERIMENTAL__: "{ suspense: false, errorBoundary: false }",
    },
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
