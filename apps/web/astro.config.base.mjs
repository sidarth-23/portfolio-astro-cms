import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const loadedEnv = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "");
export const environment = { ...loadedEnv, ...process.env };

export function createBaseWebConfig(adapter, extraConfig = {}) {
  return defineConfig({
    site: environment.ASTRO_SITE_URL || "http://localhost:4321",
    output: "static",
    session: false,
    compressHTML: true,
    env: {
      schema: {
        PAYLOAD_PUBLIC_SERVER_URL: envField.string({
          context: "server",
          access: "public",
          default: "https://cms.sidshub.in",
        }),
        PAYLOAD_API_KEY: envField.string({ context: "server", access: "secret" }),
      },
    },
    adapter,
    integrations: [sitemap()],
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
    ...extraConfig,
  });
}
