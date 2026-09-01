import type { MultilineElementTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import {
  $convertFromMarkdownString,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  INLINE_CODE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
} from "@payloadcms/richtext-lexical/lexical/markdown";
import { $createParagraphNode, $createTextNode } from "lexical";
import {
  $createFootnoteDefinitionServerNode,
  $isFootnoteDefinitionServerNode,
  FootnoteDefinitionServerNode,
} from "../nodes/FootnoteDefinitionNode.server";
import { decodeHtmlEntities } from "../utils";

const FOOTNOTE_INLINE_TRANSFORMERS = [
  BOLD_STAR,
  BOLD_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
];

const ensureDefinitionContent = (
  defNode: ReturnType<typeof $createFootnoteDefinitionServerNode>,
) => {
  if (defNode.getChildrenSize() > 0) return;
  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode(""));
  defNode.append(paragraph);
};

export const FOOTNOTE_DEFINITION_TRANSFORMER: MultilineElementTransformer = {
  type: "multiline-element",
  dependencies: [FootnoteDefinitionServerNode],
  regExpStart: /^\[\^([^\]]+)\]:\s*(.*)/,
  replace: (rootNode, children, startMatch) => {
    const defNode = $createFootnoteDefinitionServerNode(decodeHtmlEntities(startMatch[1]!));
    for (const child of children ?? []) defNode.append(child);
    ensureDefinitionContent(defNode);
    rootNode.append(defNode);
  },
  handleImportAfterStartMatch: ({ lines, rootNode, startLineIndex, startMatch }) => {
    const footnoteId = decodeHtmlEntities(startMatch[1]!);
    const contentLines = [startMatch[2] ?? ""];
    let lastLineIndex = startLineIndex;

    for (let index = startLineIndex + 1; index < lines.length; index += 1) {
      const line = lines[index]!;
      const continuationMatch = line.match(/^(?:    |\t)(.*)/);
      if (continuationMatch) {
        contentLines.push(continuationMatch[1] ?? "");
        lastLineIndex = index;
        continue;
      }
      if (line === "") {
        contentLines.push("");
        lastLineIndex = index;
        continue;
      }
      break;
    }

    const defNode = $createFootnoteDefinitionServerNode(footnoteId);
    $convertFromMarkdownString(contentLines.join("\n"), FOOTNOTE_INLINE_TRANSFORMERS, defNode);
    ensureDefinitionContent(defNode);
    rootNode.append(defNode);
    return [true, lastLineIndex];
  },
  export: (node, exportChildren) => {
    if (!$isFootnoteDefinitionServerNode(node)) return null;
    const lines = exportChildren(node).split("\n");
    const firstLine = lines.shift() ?? "";
    const rest = lines.map((line) => (line.trim() === "" ? "" : `    ${line}`)).join("\n");
    return rest
      ? `[^${node.getFootnoteId()}]: ${firstLine}\n${rest}`
      : `[^${node.getFootnoteId()}]: ${firstLine}`;
  },
};
