import { createServerFeature, createNode } from "@payloadcms/richtext-lexical";
import { AbbreviationRegistryServerNode } from "@/plugin/abbreviations/nodes/AbbreviationRegistryNode.server";
import { ABBREVIATION_REGISTRY_TRANSFORMER } from "@/plugin/abbreviations/transformers/abbreviationRegistry";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "@/plugin/abbreviations/client";

export const AbbreviationsFeature = createServerFeature({
  key: "abbreviations",
  feature: {
    ClientFeature: "./plugin/abbreviations/client#AbbreviationsFeatureClient",
    markdownTransformers: [ABBREVIATION_REGISTRY_TRANSFORMER],
    nodes: [createNode({ node: AbbreviationRegistryServerNode })],
  },
});
