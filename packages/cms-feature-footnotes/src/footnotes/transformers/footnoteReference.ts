import type { TextMatchTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import {
  $createFootnoteReferenceServerNode,
  $isFootnoteReferenceServerNode,
  FootnoteReferenceServerNode,
} from "../nodes/FootnoteReferenceNode.server";
import { decodeHtmlEntities } from "../utils";

const FOOTNOTE_REF_REGEXP = /\[\^([^\]]+)\]/;

export const FOOTNOTE_REFERENCE_TRANSFORMER: TextMatchTransformer = {
  type: "text-match",
  dependencies: [FootnoteReferenceServerNode],
  importRegExp: FOOTNOTE_REF_REGEXP,
  regExp: /\[\^([^\]]+)\]$/,
  trigger: "]",
  replace: (textNode, match) => {
    const footnoteId = decodeHtmlEntities(match[1]!);
    const refNode = $createFootnoteReferenceServerNode(footnoteId);
    textNode.replace(refNode);
  },
  export: (node) => {
    if (!$isFootnoteReferenceServerNode(node)) return null;
    return `[^${node.getFootnoteId()}]`;
  },
};
