import type { Block } from "payload";

export const CodeBlock: Block = {
  slug: "code",
  interfaceName: "CodeBlock",
  fields: [
    {
      name: "language",
      type: "select",
      required: true,
      defaultValue: "plaintext",
      options: [
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
      ],
    },
    {
      name: "filename",
      type: "text",
      required: false,
    },
    {
      name: "code",
      type: "code",
      required: true,
      label: false,
    },
    {
      name: "caption",
      type: "text",
      required: false,
    },
  ],
};
