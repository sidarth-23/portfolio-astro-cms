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

// Inline markdown transformers used when importing footnote definition content.
// LINK is intentionally excluded: using @lexical/markdown's LinkNode directly
// can produce node-class conflicts with the PayloadCMS Lexical registry.
// Bold, italic, code and strikethrough round-trip correctly.
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

export const FOOTNOTE_DEFINITION_TRANSFORMER: MultilineElementTransformer = {
  type: "multiline-element",
  dependencies: [FootnoteDefinitionServerNode],
  regExpStart: /^<footnote-def\s+id="([^"]+)">/,
  regExpEnd: {
    regExp: /^<\/footnote-def>/,
  },
  replace: (rootNode, children, startMatch, _endMatch, linesInBetween, _isImport) => {
    const footnoteId = decodeHtmlEntities(startMatch[1]!);
    const defNode = $createFootnoteDefinitionServerNode(footnoteId);

    if (children && children.length > 0) {
      // Shortcut transform path (typing in editor): children nodes provided directly.
      for (const child of children) {
        defNode.append(child);
      }
    } else if (linesInBetween && linesInBetween.length > 0) {
      // Import path: content comes as raw markdown text lines.
      // $convertFromMarkdownString uses defNode as its root so paragraphs are
      // appended directly to the definition, not to the main editor root.
      const markdownContent = linesInBetween.join("\n");
      $convertFromMarkdownString(markdownContent, FOOTNOTE_INLINE_TRANSFORMERS, defNode);
    }

    // canBeEmpty() returns false — ensure at least one paragraph.
    if (defNode.getChildrenSize() === 0) {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(""));
      defNode.append(paragraph);
    }

    rootNode.append(defNode);
  },
  export: (node, exportChildren) => {
    if (!$isFootnoteDefinitionServerNode(node)) return null;
    const id = node.getFootnoteId();
    const content = exportChildren(node);
    // Indent continuation lines with 4 spaces (standard markdown footnote format)
    const lines = content.split("\n");
    const firstLine = lines[0] ?? "";
    const rest = lines
      .slice(1)
      .map((l) => (l.trim() === "" ? "" : `    ${l}`))
      .join("\n");
    return rest ? `[^${id}]: ${firstLine}\n${rest}` : `[^${id}]: ${firstLine}`;
  },
};
