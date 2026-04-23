"use client";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { AbbreviationRegistryNode } from "@/plugin/abbreviations/nodes/AbbreviationRegistryNode.client";
import { ABBREVIATION_REGISTRY_TRANSFORMER } from "@/plugin/abbreviations/transformers/abbreviationRegistry";

export const AbbreviationsFeatureClient = createClientFeature({
  markdownTransformers: [ABBREVIATION_REGISTRY_TRANSFORMER],
  nodes: [AbbreviationRegistryNode],
});
