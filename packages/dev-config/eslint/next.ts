import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import type { Linter } from "eslint";

import { baseConfig } from "./base";

function createNextConfig(importMetaUrl: string): Linter.Config[] {
  const filename = fileURLToPath(importMetaUrl);
  const directory = dirname(filename);

  const compat = new FlatCompat({ baseDirectory: directory });

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

export { createNextConfig };
