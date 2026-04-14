import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
const baseConfig = tseslint.config(
  // Register the @typescript-eslint plugin globally (no parser — let each language config handle its own)
  {
    plugins: { "@typescript-eslint": tseslint.plugin },
  },
  // Apply TypeScript parser only to TS/TSX files
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
  // Spread the rules portion of recommended (already scoped to TS files in object[1]) but skip object[0] which sets parser globally
  ...tseslint.configs.recommended.slice(1),
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^(_|ignore)",
        },
      ],
    },
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@sidshub/cms-core/src/*", "@sidshub/cms-core/lib/*"],
              message:
                "Use curated @sidshub/cms-core subpath exports (for example @sidshub/cms-core/client or /icons), not internal package paths.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["dist/", "node_modules/", "*.generated.*"],
  },
);

export default baseConfig;
