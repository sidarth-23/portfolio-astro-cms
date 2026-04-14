import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import baseConfig from "./base.mjs";

/**
 * @param {string} importMetaUrl - pass `import.meta.url` from the consuming config
 * @returns {import("eslint").Linter.Config[]}
 */
export default function createNextConfig(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);

  const compat = new FlatCompat({ baseDirectory: __dirname });

  return [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    ...baseConfig,
    {
      ignores: [
        ".next/",
        "src/payload-types.ts",
        "src/payload-generated-schema.ts",
        "src/app/(payload)/importMap.js",
      ],
    },
  ];
}
