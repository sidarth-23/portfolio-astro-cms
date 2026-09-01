import { defineOptions } from "./utils";

export const CODE_BLOCK_LANGUAGE_OPTIONS = defineOptions([
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
]);

export type CodeBlockLanguage = (typeof CODE_BLOCK_LANGUAGE_OPTIONS)[number]["value"];

export const CODE_BLOCK_LANGUAGES_MAP: Record<string, string> = Object.fromEntries(
  CODE_BLOCK_LANGUAGE_OPTIONS.map(({ value, label }) => [value, label]),
);
