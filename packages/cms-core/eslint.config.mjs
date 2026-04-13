import baseConfig from "@sidshub/eslint-config";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: ["src/payload-types.ts"],
  },
];
