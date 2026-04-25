import type { MultilineElementTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import { $createParagraphNode, $createTextNode } from "lexical";
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
  replace: (rootNode, children, startMatch, _endMatch, linesInBetween, _isImport) => {
    const footnoteId = decodeHtmlEntities(startMatch[1]!);
    const defNode = $createFootnoteDefinitionServerNode(footnoteId);

    if (children && children.length > 0) {
      // Shortcut transform path (typing in editor): children nodes are provided directly
      for (const child of children) {
        defNode.append(child);
      }
    } else if (linesInBetween) {
      // Import path: content comes as raw text lines between the start/end markers.
      // Group consecutive non-empty lines into paragraphs (separated by blank lines).
      const groups: string[][] = [[]];
      for (const line of linesInBetween) {
        if (line.trim() === "") {
          if (groups[groups.length - 1]!.length > 0) {
            groups.push([]);
          }
        } else {
          groups[groups.length - 1]!.push(line);
        }
      }

      for (const group of groups) {
        if (group.length === 0) continue;
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(group.join("\n")));
        defNode.append(paragraph);
      }
    }

    // canBeEmpty() returns false, so always ensure at least one paragraph
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
