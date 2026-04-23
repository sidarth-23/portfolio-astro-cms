import { retext } from "retext";
import retextSmartypants from "retext-smartypants";
import type { Text } from "mdast";

import type { MarkdownPreprocessRule, MarkdownReplacement } from "@/lib/markdownPreprocess/types";
import { hasValidOffsets } from "@/lib/markdownPreprocess/utils";

const TYPOGRAPHER_SKIPPED_ANCESTOR_TYPES = new Set([
  "code",
  "definition",
  "html",
  "inlineCode",
  "toml",
  "yaml",
]);

const smartypantsProcessor = retext().use(retextSmartypants);

const applySmartTypography = (value: string): string => {
  return String(smartypantsProcessor.processSync(value));
};

type TraversableTextNode = {
  children?: TraversableTextNode[];
  position?: Text["position"];
  type?: string;
  value?: unknown;
};

export const collectSmartTypographyReplacements: MarkdownPreprocessRule = ({ root }) => {
  const replacements: MarkdownReplacement[] = [];

  const walk = (node: TraversableTextNode, isBlocked: boolean): void => {
    const nodeType = typeof node.type === "string" ? node.type : "";
    const blocked = isBlocked || TYPOGRAPHER_SKIPPED_ANCESTOR_TYPES.has(nodeType);

    if (nodeType === "text" && !blocked && typeof node.value === "string") {
      const start = node.position?.start?.offset;
      const end = node.position?.end?.offset;

      if (hasValidOffsets(start, end) && typeof end === "number") {
        const transformed = applySmartTypography(node.value);
        if (transformed !== node.value) {
          replacements.push({
            start,
            end,
            replacement: transformed,
          });
        }
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, blocked);
      }
    }
  };

  walk(root as TraversableTextNode, false);
  return replacements;
};
