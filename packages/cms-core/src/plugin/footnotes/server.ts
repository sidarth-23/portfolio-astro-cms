import { createServerFeature, createNode } from "@payloadcms/richtext-lexical";
import { FootnoteReferenceServerNode } from "@/plugin/footnotes/nodes/FootnoteReferenceNode.server";
import { FootnoteDefinitionServerNode } from "@/plugin/footnotes/nodes/FootnoteDefinitionNode.server";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "@/plugin/footnotes/transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "@/plugin/footnotes/transformers/footnoteDefinition";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "@/plugin/footnotes/client";

export const FootnotesFeature = createServerFeature({
  key: "footnotes",
  feature: {
    ClientFeature: "./plugin/footnotes/client#FootnotesFeatureClient",
    markdownTransformers: [FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
    nodes: [
      createNode({ node: FootnoteReferenceServerNode }),
      createNode({ node: FootnoteDefinitionServerNode }),
    ],
  },
});
