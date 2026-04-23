import { createServerFeature } from "@payloadcms/richtext-lexical";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "./client";

export const MarkdownPasteFeature = createServerFeature({
  key: "markdownPaste",
  feature: {
    ClientFeature: "@sidshub/cms-plugin-markdown-paste/feature/client#MarkdownPasteFeatureClient",
  },
});
