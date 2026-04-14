"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";

import { MarkdownPastePlugin } from "@/plugin/markdown-paste/MarkdownPastePlugin";

export const MarkdownPasteFeatureClient = createClientFeature({
  plugins: [
    {
      Component: MarkdownPastePlugin,
      position: "normal",
    },
  ],
});
