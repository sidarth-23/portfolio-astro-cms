import type { Block } from "payload";
import { CODE_BLOCK_LANGUAGE_OPTIONS, CODE_BLOCK_LANGUAGES_MAP } from "@cms/lib/content";

export const CodeBlock: Block = {
  slug: "code",
  interfaceName: "CodeBlock",
  fields: [
    {
      name: "language",
      type: "select",
      required: true,
      defaultValue: "plaintext",
      options: CODE_BLOCK_LANGUAGE_OPTIONS,
    },
    {
      name: "code",
      type: "code",
      required: true,
      label: false,
      admin: {
        components: {
          Field: {
            clientProps: { languages: CODE_BLOCK_LANGUAGES_MAP },
            path: "./components/admin/CodeFieldComponent#CodeFieldComponent",
          },
        },
      },
    },
    {
      name: "caption",
      type: "text",
      required: false,
      label: "Caption (optional)",
    },
  ],
};
