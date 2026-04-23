"use client";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { DefinitionListNode } from "@/plugin/definition-list/nodes/DefinitionListNode.client";
import { DefinitionTermNode } from "@/plugin/definition-list/nodes/DefinitionTermNode.client";
import { DefinitionDescriptionNode } from "@/plugin/definition-list/nodes/DefinitionDescriptionNode.client";
import { DEFINITION_LIST_TRANSFORMER } from "@/plugin/definition-list/transformers/definitionList";

export const DefinitionListFeatureClient = createClientFeature({
  markdownTransformers: [DEFINITION_LIST_TRANSFORMER],
  nodes: [DefinitionListNode, DefinitionTermNode, DefinitionDescriptionNode],
});
