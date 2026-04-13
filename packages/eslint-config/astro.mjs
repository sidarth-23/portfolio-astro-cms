import eslintPluginAstro from "eslint-plugin-astro";
import baseConfig from "./base.mjs";

/** @type {import("eslint").Linter.Config[]} */
const astroConfig = [
  ...eslintPluginAstro.configs["flat/recommended"],
  ...baseConfig,
  {
    ignores: ["dist/", ".astro/"],
  },
];

export default astroConfig;
