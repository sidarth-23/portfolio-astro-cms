import cloudflare from "@astrojs/cloudflare";
import { createBaseWebConfig } from "./astro.config.base.mjs";

export default createBaseWebConfig(
  cloudflare({
    session: false,
    configPath: "./wrangler.jsonc",
    prerenderEnvironment: "node",
  }),
);
