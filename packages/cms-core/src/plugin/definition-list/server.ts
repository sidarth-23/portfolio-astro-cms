import { createServerFeature, createNode } from "@payloadcms/richtext-lexical";
import { DefinitionListServerNode } from "@/plugin/definition-list/nodes/DefinitionListNode.server";
import { DefinitionTermServerNode } from "@/plugin/definition-list/nodes/DefinitionTermNode.server";
import { DefinitionDescriptionServerNode } from "@/plugin/definition-list/nodes/DefinitionDescriptionNode.server";
import { DEFINITION_LIST_TRANSFORMER } from "@/plugin/definition-list/transformers/definitionList";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "@/plugin/definition-list/client";

export const DefinitionListFeature = createServerFeature({
  key: "definitionList",
  feature: {
    ClientFeature: "./plugin/definition-list/client#DefinitionListFeatureClient",
    markdownTransformers: [DEFINITION_LIST_TRANSFORMER],
    nodes: [
      createNode({ node: DefinitionListServerNode }),
      createNode({ node: DefinitionTermServerNode }),
      createNode({ node: DefinitionDescriptionServerNode }),
    ],
  },
});
