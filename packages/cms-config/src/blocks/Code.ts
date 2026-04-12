import type { Block } from "payload";

const CODE_BLOCK_LANGUAGES = [
  { label: "Plain Text", value: "plaintext" },
  { label: "Bash", value: "bash" },
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSX", value: "jsx" },
  { label: "TSX", value: "tsx" },
  { label: "Python", value: "python" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
];

export const CodeBlock: Block = {
  slug: "code",
  interfaceName: "CodeBlock",
  fields: [
    {
      name: "mode",
      type: "select",
      required: true,
      defaultValue: "single",
      options: [
        { label: "Single", value: "single" },
        { label: "Multiple (Tabs)", value: "multiple" },
      ],
    },
    {
      name: "language",
      type: "select",
      required: true,
      defaultValue: "plaintext",
      options: CODE_BLOCK_LANGUAGES,
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
          options: CODE_BLOCK_LANGUAGES,
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
