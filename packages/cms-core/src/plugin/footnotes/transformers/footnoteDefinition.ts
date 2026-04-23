import type { MultilineElementTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import {
  $createFootnoteDefinitionServerNode,
  $isFootnoteDefinitionServerNode,
  FootnoteDefinitionServerNode,
} from "../nodes/FootnoteDefinitionNode.server";
import { decodeHtmlEntities } from "../utils";

export const FOOTNOTE_DEFINITION_TRANSFORMER: MultilineElementTransformer = {
  type: "multiline-element",
  dependencies: [FootnoteDefinitionServerNode],
  regExpStart: /^<footnote-def\s+id="([^"]+)">/,
  regExpEnd: {
    regExp: /^<\/footnote-def>/,
  },
  replace: (parentNode, children, match, _endMatch) => {
    const footnoteId = decodeHtmlEntities(match[1]!);
    const defNode = $createFootnoteDefinitionServerNode(footnoteId);
    if (children) {
      for (const child of children) {
        defNode.append(child);
      }
    }
    parentNode.append(defNode);
  },
  export: (node, exportChildren) => {
    if (!$isFootnoteDefinitionServerNode(node)) return null;
    const id = node.getFootnoteId();
    const content = exportChildren(node);
    // Indent continuation lines with 4 spaces
    const lines = content.split("\n");
    const firstLine = lines[0] ?? "";
    const rest = lines
      .slice(1)
      .map((l) => (l.trim() === "" ? "" : `    ${l}`))
      .join("\n");
    return rest ? `[^${id}]: ${firstLine}\n${rest}` : `[^${id}]: ${firstLine}`;
  },
};
