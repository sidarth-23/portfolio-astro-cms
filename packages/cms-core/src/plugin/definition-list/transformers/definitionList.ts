import type { MultilineElementTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import { $createTextNode, type ElementNode } from "lexical";
import {
  $createDefinitionListServerNode,
  $isDefinitionListServerNode,
  DefinitionListServerNode,
} from "../nodes/DefinitionListNode.server";
import {
  $createDefinitionTermServerNode,
  $isDefinitionTermServerNode,
  DefinitionTermServerNode,
} from "../nodes/DefinitionTermNode.server";
import {
  $createDefinitionDescriptionServerNode,
  $isDefinitionDescriptionServerNode,
  DefinitionDescriptionServerNode,
} from "../nodes/DefinitionDescriptionNode.server";

const DT_RE = /^<dt>(.*)<\/dt>$/;
const DD_RE = /^<dd>(.*)<\/dd>$/;

/**
 * Unescape HTML entities that were escaped during preprocessing.
 * Only `&lt;`, `&gt;`, and `&amp;` are needed — these are the only
 * characters escaped in `escapeContent` in the preprocessing rule.
 */
const unescapeContent = (s: string): string =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export const DEFINITION_LIST_TRANSFORMER: MultilineElementTransformer = {
  type: "multiline-element",
  dependencies: [
    DefinitionListServerNode,
    DefinitionTermServerNode,
    DefinitionDescriptionServerNode,
  ],
  regExpStart: /^<deflist>$/,
  regExpEnd: {
    regExp: /^<\/deflist>$/,
  },

  replace: (parentNode, _children, _startMatch, _endMatch, linesInBetween) => {
    if (!linesInBetween) return;

    const listNode = $createDefinitionListServerNode();

    for (const line of linesInBetween) {
      const dtMatch = DT_RE.exec(line);
      const ddMatch = DD_RE.exec(line);

      if (dtMatch) {
        const termNode = $createDefinitionTermServerNode();
        const textNode = $createTextNode(unescapeContent(dtMatch[1]!));
        termNode.append(textNode);
        listNode.append(termNode);
      } else if (ddMatch) {
        const descNode = $createDefinitionDescriptionServerNode();
        const textNode = $createTextNode(unescapeContent(ddMatch[1]!));
        descNode.append(textNode);
        listNode.append(descNode);
      }
    }

    parentNode.append(listNode);
  },

  export: (node, exportChildren) => {
    if (!$isDefinitionListServerNode(node)) return null;

    const lines: string[] = [];
    for (const child of node.getChildren()) {
      if ($isDefinitionTermServerNode(child)) {
        lines.push(exportChildren(child as ElementNode));
      } else if ($isDefinitionDescriptionServerNode(child)) {
        lines.push(`: ${exportChildren(child as ElementNode)}`);
      }
    }

    return lines.length > 0 ? lines.join("\n") : null;
  },
};
