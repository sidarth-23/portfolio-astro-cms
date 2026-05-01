import eslintPluginAstro from "eslint-plugin-astro";
import type { Linter } from "eslint";

import { baseConfig } from "./base";

const astroConfig: Linter.Config[] = [
  ...eslintPluginAstro.configs["flat/recommended"],
  ...baseConfig,
  {
    ignores: ["dist/", ".astro/"],
  },
];

export { astroConfig };
