"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { siMarkdown } from "simple-icons";

import { OPEN_MARKDOWN_IMPORT_COMMAND } from "./plugins/markdownImportCommand";
import { MarkdownImportPlugin } from "./plugins/MarkdownImportPlugin";

function MarkdownImportIcon() {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      focusable="false"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={siMarkdown.path} fill="currentColor" />
    </svg>
  );
}

export const MarkdownPasteFeatureClient = createClientFeature({
  toolbarFixed: {
    groups: [
      {
        type: "buttons",
        items: [
          {
            ChildComponent: MarkdownImportIcon,
            key: "markdownImport",
            label: "Import Markdown",
            onSelect: ({ editor }) => {
              editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, undefined);
            },
          },
        ],
        key: "markdownImport",
        order: 21,
      },
    ],
  },
  slashMenu: {
    groups: [
      {
        items: [
          {
            Icon: MarkdownImportIcon,
            key: "markdownImport",
            keywords: ["markdown", "md", "import"],
            label: "Import Markdown",
            onSelect: ({ editor }) => {
              editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, undefined);
            },
          },
        ],
        key: "advanced",
        label: "Advanced",
      },
    ],
  },
  plugins: [
    {
      Component: MarkdownImportPlugin,
      position: "normal",
    },
  ],
});
