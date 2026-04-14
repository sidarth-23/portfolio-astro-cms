import reactHooksPlugin from "eslint-plugin-react-hooks";
import baseConfig from "@sidshub/eslint-config";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: ["src/payload-types.ts"],
  },
  {
    files: ["src/**/*.{ts,tsx,jsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../lib/*",
                "!../lib/client",
                "!../lib/content",
                "!../lib/icons",
                "!../lib/validation",
                "!../lib/og",
                "!../lib/email",
                "!../lib/seo",
                "!../lib/seoFieldMapping",
                "!../lib/orphanedMedia",
                "!../lib/deployment",
                "../../lib/*",
                "!../../lib/client",
                "!../../lib/content",
                "!../../lib/icons",
                "!../../lib/validation",
                "!../../lib/og",
                "!../../lib/email",
                "!../../lib/seo",
                "!../../lib/seoFieldMapping",
                "!../../lib/orphanedMedia",
                "!../../lib/deployment",
                "../../../lib/*",
                "!../../../lib/client",
                "!../../../lib/content",
                "!../../../lib/icons",
                "!../../../lib/validation",
                "!../../../lib/og",
                "!../../../lib/email",
                "!../../../lib/seo",
                "!../../../lib/seoFieldMapping",
                "!../../../lib/orphanedMedia",
                "!../../../lib/deployment",
              ],
              message: "Import from `lib/<module>` barrels, not deeper files.",
            },
            {
              group: [
                "**/lib/cms/**",
                "**/lib/options/**",
                "**/lib/iconValue",
                "**/lib/simpleIconsCatalog",
                "**/lib/phosphorIconsCatalog",
                "**/lib/createSlug",
                "**/lib/resolveResumeUrl",
              ],
              message: "Legacy lib paths are not allowed. Use the new module barrels.",
            },
          ],
        },
      ],
    },
  },
];
