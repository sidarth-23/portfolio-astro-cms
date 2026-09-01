import { createServerFeature } from "@payloadcms/richtext-lexical";

export const MarkdownPasteFeature = createServerFeature({
  key: "markdownPaste",
  feature: {
    ClientFeature: "./lib/editor/features/markdown-paste/client#MarkdownPasteFeatureClient",
  },
});
