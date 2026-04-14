import { createServerFeature } from "@payloadcms/richtext-lexical";

export const MarkdownPasteFeature = createServerFeature({
  key: "markdownPaste",
  feature: {
    ClientFeature: "@sidshub/cms-editor/features/markdownPaste/client#MarkdownPasteFeatureClient",
  },
});
