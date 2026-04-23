"use client";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";

import { FootnoteReferenceNode } from "./nodes/FootnoteReferenceNode.client";
import { FootnoteDefinitionNode } from "./nodes/FootnoteDefinitionNode.client";
import { FootnotePlugin } from "./plugins/FootnotePlugin";
import { FootnoteEntriesPanelPlugin } from "./plugins/FootnoteEntriesPanelPlugin";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "./transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "./transformers/footnoteDefinition";
import { OPEN_FOOTNOTE_MODAL_COMMAND } from "./plugins/footnoteCommand";

function FootnoteIcon() {
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
      <path
        d="M17.5 9.5a1 1 0 0 1-1 1h-8a1 1 0 0 1 0-2h8a1 1 0 0 1 1 1Zm-1 2h-8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2Zm6-5v10A2.5 2.5 0 0 1 20 19H4a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 4 4h16a2.5 2.5 0 0 1 2.5 2.5ZM4 17h3V6H4a.5.5 0 0 0-.5.5v10A.5.5 0 0 0 4 17Zm16 0a.5.5 0 0 0 .5-.5v-10A.5.5 0 0 0 20 6H9v11Z"
        fill="currentColor"
      />
    </svg>
  );
}

export const FootnotesFeatureClient = createClientFeature({
  markdownTransformers: [FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
  nodes: [FootnoteReferenceNode, FootnoteDefinitionNode],
  toolbarFixed: {
    groups: [
      {
        type: "buttons",
        key: "markdownImport",
        order: 22,
        items: [
          {
            ChildComponent: FootnoteIcon,
            key: "insertFootnote",
            label: "Footnote",
            order: 2,
            onSelect: ({ editor }) => {
              editor.dispatchCommand(OPEN_FOOTNOTE_MODAL_COMMAND, undefined);
            },
          },
        ],
      },
    ],
  },
  slashMenu: {
    groups: [
      {
        key: "advanced",
        label: "Advanced",
        items: [
          {
            Icon: FootnoteIcon,
            key: "insertFootnote",
            label: "Footnote",
            keywords: ["footnote", "reference", "citation", "note"],
            onSelect: ({ editor }) => {
              editor.dispatchCommand(OPEN_FOOTNOTE_MODAL_COMMAND, undefined);
            },
          },
        ],
      },
    ],
  },
  plugins: [
    {
      Component: FootnotePlugin,
      position: "normal",
    },
    {
      Component: FootnoteEntriesPanelPlugin,
      position: "belowContainer",
    },
  ],
});
