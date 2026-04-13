import type { Block } from "payload";
import { CODE_BLOCK_LANGUAGE_OPTIONS, CODE_BLOCK_MODE_OPTIONS } from "../lib/content";

export const CodeBlock: Block = {
  slug: "code",
  interfaceName: "CodeBlock",
  fields: [
    {
      name: "mode",
      type: "select",
      required: true,
      defaultValue: "single",
      options: CODE_BLOCK_MODE_OPTIONS,
    },
    {
      name: "language",
      type: "select",
      required: true,
      defaultValue: "plaintext",
      options: CODE_BLOCK_LANGUAGE_OPTIONS,
      admin: {
        condition: (_: unknown, siblingData: Record<string, unknown>) =>
          siblingData?.mode !== "multiple",
      },
    },
    {
      name: "code",
      type: "code",
      required: true,
      label: false,
      admin: {
        condition: (_: unknown, siblingData: Record<string, unknown>) =>
          siblingData?.mode !== "multiple",
      },
    },
    {
      name: "entries",
      type: "array",
      minRows: 2,
      admin: {
        condition: (_: unknown, siblingData: Record<string, unknown>) =>
          siblingData?.mode === "multiple",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Tab Name",
        },
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
        },
      ],
    },
    {
      name: "caption",
      type: "text",
      required: false,
      label: "Caption (optional)",
    },
  ],
};
