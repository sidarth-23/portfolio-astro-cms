"use client";

import {
  createClientFeature,
  slashMenuBasicGroupWithItems,
  toolbarAddDropdownGroupWithItems,
  toolbarFeatureButtonsGroupWithItems,
} from "@payloadcms/richtext-lexical/client";
import { siMarkdown } from "simple-icons";

import { OPEN_MARKDOWN_IMPORT_COMMAND } from "./markdownImportCommand";
import { MarkdownImportPlugin } from "./MarkdownImportPlugin";

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
      toolbarFeatureButtonsGroupWithItems([
        {
          ChildComponent: MarkdownImportIcon,
          key: "markdownImportToolbar",
          label: "Import Markdown",
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, undefined);
          },
        },
      ]),
      toolbarAddDropdownGroupWithItems([
        {
          ChildComponent: MarkdownImportIcon,
          key: "markdownImport",
          label: "Import Markdown",
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, undefined);
          },
        },
      ]),
    ],
  },
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: MarkdownImportIcon,
          key: "markdownImport",
          keywords: ["markdown", "md", "import"],
          label: "Import Markdown",
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, undefined);
          },
        },
      ]),
    ],
  },
  plugins: [
    {
      Component: MarkdownImportPlugin,
      position: "normal",
    },
  ],
});
