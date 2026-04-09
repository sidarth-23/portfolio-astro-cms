import eslintPluginAstro from "eslint-plugin-astro";

const eslintConfig = [
  ...eslintPluginAstro.configs["flat/recommended"],
  {
    ignores: ["dist/", ".astro/"],
  },
];

export default eslintConfig;
