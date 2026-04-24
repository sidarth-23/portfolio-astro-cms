import type { ThematicBreak } from "mdast";

import type { MarkdownReplacement } from "../types";
import type { MarkdownPreprocessRule } from "../types";
import { hasValidOffsets } from "../utils";

export const collectThematicBreakReplacements: MarkdownPreprocessRule = ({ markdown, root }) => {
  const replacements: MarkdownReplacement[] = [];

  for (const child of root.children) {
    if (child.type !== "thematicBreak") {
      continue;
    }

    const thematicBreak = child as ThematicBreak;
    const start = thematicBreak.position?.start?.offset;
    const end = thematicBreak.position?.end?.offset;

    if (!hasValidOffsets(start, end) || typeof end !== "number") {
      continue;
    }

    const source = markdown.slice(start, end);
    if (source.trim() === "---") {
      continue;
    }

    const leadingWhitespaceLength = source.length - source.trimStart().length;
    const leadingWhitespace = source.slice(0, leadingWhitespaceLength);

    replacements.push({
      start,
      end,
      replacement: `${leadingWhitespace}---`,
    });
  }

  return replacements;
};
