import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Root } from "mdast";

import type { MarkdownReplacement } from "./types";

export const parseMarkdown = (markdown: string): Root => {
  return fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
};

export const hasValidOffsets = (start: unknown, end: unknown): start is number => {
  return typeof start === "number" && typeof end === "number" && end >= start;
};

const replacementsOverlap = (a: MarkdownReplacement, b: MarkdownReplacement): boolean => {
  return a.start < b.end && b.start < a.end;
};

export const pushReplacement = (
  replacements: MarkdownReplacement[],
  candidate: MarkdownReplacement,
): void => {
  if (replacements.some((existing) => replacementsOverlap(existing, candidate))) {
    return;
  }

  replacements.push(candidate);
};

export const applyMarkdownReplacements = (
  markdown: string,
  replacements: MarkdownReplacement[],
): string => {
  if (replacements.length === 0) {
    return markdown;
  }

  return replacements
    .slice()
    .sort((a, b) => b.start - a.start)
    .reduce((current, replacement) => {
      return (
        current.slice(0, replacement.start) +
        replacement.replacement +
        current.slice(replacement.end)
      );
    }, markdown);
};
