import astroConfig from "@sidshub/eslint-config/astro";

export default [
  ...astroConfig,
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];
