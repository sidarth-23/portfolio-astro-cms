import { MARKDOWN_PREPROCESS_RULES } from "@/lib/markdownPreprocess/rules";
import type { MarkdownReplacement } from "@/lib/markdownPreprocess/types";
import {
  applyMarkdownReplacements,
  parseMarkdown,
  pushReplacement,
} from "@/lib/markdownPreprocess/utils";

/**
 * Pre-processes markdown for Payload's block conversion.
 *
 * Rules are collected from independent mdast-based transformers to keep this
 * pipeline easy to extend.
 */
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
