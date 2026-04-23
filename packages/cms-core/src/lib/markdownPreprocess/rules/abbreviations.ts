import type { MarkdownPreprocessRule, MarkdownReplacement } from "@/lib/markdownPreprocess/types";
import { pushReplacement } from "@/lib/markdownPreprocess/utils";

// Matches a single abbreviation definition line: *[ABBR]: Full Text
const ABBR_DEF_RE = /^\*\[([^\]]+)\]:\s*(.+)$/gm;

/**
 * MarkdownPreprocessRule that extracts abbreviation definitions from their
 * native markdown syntax and rewrites them to a synthetic self-closing tag:
 *
 *   Input:
 *     *[HTML]: HyperText Markup Language
 *     *[CSS]: Cascading Style Sheets
 *
 *   Output:
 *     (definition lines removed, replaced with empty string)
 *     <abbreviations data='{"HTML":"HyperText Markup Language","CSS":"Cascading Style Sheets"}' />
 *     (inserted at position 0)
 *
 * The synthetic tag is picked up by the AbbreviationRegistry ElementTransformer
 * which creates an AbbreviationRegistryServerNode in the Lexical document.
 */
export const collectAbbreviationReplacements: MarkdownPreprocessRule = ({
  markdown,
}): MarkdownReplacement[] => {
  const replacements: MarkdownReplacement[] = [];
  const abbreviations: Record<string, string> = {};

  let match: RegExpExecArray | null;
  ABBR_DEF_RE.lastIndex = 0;

  while ((match = ABBR_DEF_RE.exec(markdown)) !== null) {
    const abbr = match[1]!.trim();
    if (!abbr) continue;
    const expansion = match[2]!.trim();
    abbreviations[abbr] = expansion;

    const start = match.index;
    const end = match.index + match[0].length;

    // Replace the definition line with empty string (remove it).
    pushReplacement(replacements, { start, end, replacement: "" });
  }

  if (Object.keys(abbreviations).length === 0) {
    return replacements;
  }

  // Insert a synthetic abbreviation registry tag at the very start of the document.
  const json = JSON.stringify(abbreviations);
  pushReplacement(replacements, {
    start: 0,
    end: 0,
    replacement: `<abbreviations data='${json}' />\n`,
  });

  return replacements;
};
