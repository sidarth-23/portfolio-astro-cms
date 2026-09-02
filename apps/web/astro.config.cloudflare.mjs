import cloudflare from "@astrojs/cloudflare";
import { createBaseWebConfig, environment } from "./astro.config.base.mjs";

if (!environment.PAYLOAD_API_KEY) {
  throw new Error("PAYLOAD_API_KEY must be set for a Cloudflare build");
}

process.env.ASTRO_SITE_URL ??= environment.ASTRO_SITE_URL || "https://www.sidshub.in";
process.env.PAYLOAD_PUBLIC_SERVER_URL ??=
  environment.PAYLOAD_PUBLIC_SERVER_URL || "https://cms.sidshub.in";

export default createBaseWebConfig(
  cloudflare({
    session: false,
    configPath: "./wrangler.jsonc",
    prerenderEnvironment: "node",
  }),
);
