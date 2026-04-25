import { astroConfig } from "@sidshub/dev-config/eslint";

export default [
  ...astroConfig,
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];
