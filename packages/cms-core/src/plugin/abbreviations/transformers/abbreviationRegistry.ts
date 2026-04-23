import type { ElementTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import {
  $createAbbreviationRegistryServerNode,
  $isAbbreviationRegistryServerNode,
  AbbreviationRegistryServerNode,
} from "../nodes/AbbreviationRegistryNode.server";

export const ABBREVIATION_REGISTRY_TRANSFORMER: ElementTransformer = {
  type: "element",
  dependencies: [AbbreviationRegistryServerNode],
  regExp: /^<abbreviations\s+data='(.+)'\s*\/>$/,
  replace: (parentNode, _children, match) => {
    let abbreviations: Record<string, string>;
    try {
      abbreviations = JSON.parse(match[1]!) as Record<string, string>;
    } catch {
      return;
    }
    const node = $createAbbreviationRegistryServerNode(abbreviations);
    parentNode.replace(node);
  },
  export: (node) => {
    if (!$isAbbreviationRegistryServerNode(node)) return null;
    const abbreviations = node.getAbbreviations();
    const entries = Object.entries(abbreviations);
    if (entries.length === 0) return null;
    // Serialize back to *[ABBR]: Full Text lines
    return entries.map(([abbr, expansion]) => `*[${abbr}]: ${expansion}`).join("\n");
  },
};
