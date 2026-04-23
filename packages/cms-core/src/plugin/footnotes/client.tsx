"use client";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { FootnoteReferenceNode } from "@/plugin/footnotes/nodes/FootnoteReferenceNode.client";
import { FootnoteDefinitionNode } from "@/plugin/footnotes/nodes/FootnoteDefinitionNode.client";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "@/plugin/footnotes/transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "@/plugin/footnotes/transformers/footnoteDefinition";

export const FootnotesFeatureClient = createClientFeature({
  markdownTransformers: [FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
  nodes: [FootnoteReferenceNode, FootnoteDefinitionNode],
});
