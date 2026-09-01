import { createServerFeature, createNode } from "@payloadcms/richtext-lexical";
import { FootnoteReferenceServerNode } from "./nodes/FootnoteReferenceNode.server";
import { FootnoteDefinitionServerNode } from "./nodes/FootnoteDefinitionNode.server";
import { FootnoteSeparatorServerNode } from "./nodes/FootnoteSeparatorNode.server";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "./transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "./transformers/footnoteDefinition";

export const FootnotesFeature = createServerFeature({
  key: "footnotes",
  feature: {
    ClientFeature: "./lib/editor/features/footnotes/client#FootnotesFeatureClient",
    markdownTransformers: [FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
    nodes: [
      createNode({ node: FootnoteReferenceServerNode }),
      createNode({ node: FootnoteDefinitionServerNode }),
      createNode({ node: FootnoteSeparatorServerNode }),
    ],
  },
});
