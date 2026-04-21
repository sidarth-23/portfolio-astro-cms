import { TRANSFORMERS } from "@lexical/markdown";
import { createServerFeature } from "@payloadcms/richtext-lexical";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "@/plugin/markdown-paste/client";

export const MarkdownPasteFeature = createServerFeature({
  key: "markdownPaste",
  feature: {
    ClientFeature: "./plugin/markdown-paste/client#MarkdownPasteFeatureClient",
    markdownTransformers: TRANSFORMERS,
  },
});
