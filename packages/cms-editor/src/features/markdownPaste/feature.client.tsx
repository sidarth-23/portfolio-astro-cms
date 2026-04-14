"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { MarkdownPastePlugin } from "./MarkdownPastePlugin";

export const MarkdownPasteFeatureClient = createClientFeature({
  plugins: [
    {
      Component: MarkdownPastePlugin,
      position: "normal",
    },
  ],
});
