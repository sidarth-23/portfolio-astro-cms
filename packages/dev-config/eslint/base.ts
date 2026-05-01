import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const baseConfig = defineConfig(
  {
    plugins: { "@typescript-eslint": tseslint.plugin },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
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

export { baseConfig };
