import { MARKDOWN_PREPROCESS_RULES } from "./rules";
import type { MarkdownReplacement } from "./types";
import { applyMarkdownReplacements, parseMarkdown, pushReplacement } from "./utils";

export const preprocessMarkdownForPayload = (markdown: string): string => {
  if (!markdown.trim()) {
    return markdown;
  }

  const root = parseMarkdown(markdown);
  const replacements: MarkdownReplacement[] = [];

  for (const rule of MARKDOWN_PREPROCESS_RULES) {
    const ruleReplacements = rule({ markdown, root });

    for (const replacement of ruleReplacements) {
      pushReplacement(replacements, replacement);
    }
  }

  return applyMarkdownReplacements(markdown, replacements);
};
