"use client";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { FootnoteReferenceNode } from "./nodes/FootnoteReferenceNode.client";
import { FootnoteDefinitionNode } from "./nodes/FootnoteDefinitionNode.client";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "./transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "./transformers/footnoteDefinition";

export const FootnotesFeatureClient = createClientFeature({
  markdownTransformers: [FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
  nodes: [FootnoteReferenceNode, FootnoteDefinitionNode],
});
