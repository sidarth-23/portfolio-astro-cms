import { createServerFeature, createNode } from "@payloadcms/richtext-lexical";
import { FootnoteReferenceServerNode } from "./nodes/FootnoteReferenceNode.server";
import { FootnoteDefinitionServerNode } from "./nodes/FootnoteDefinitionNode.server";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "./transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "./transformers/footnoteDefinition";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "./client";

export const FootnotesFeature = createServerFeature({
  key: "footnotes",
  feature: {
    ClientFeature: "@sidshub/cms-feature-footnotes/client#FootnotesFeatureClient",
    markdownTransformers: [FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
    nodes: [
      createNode({ node: FootnoteReferenceServerNode }),
      createNode({ node: FootnoteDefinitionServerNode }),
    ],
  },
});
