import node from "@astrojs/node";
import { createBaseWebConfig } from "./astro.config.base.mjs";

export default createBaseWebConfig(node({ mode: "standalone" }));
