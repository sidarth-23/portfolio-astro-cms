import type { MarkdownPreprocessRule, MarkdownReplacement } from "@/lib/markdownPreprocess/types";
import {
  getMarkdownItInstance,
  lineRangeToOffsets,
} from "@/lib/markdownPreprocess/markdownItUtils";
import { hasValidOffsets, pushReplacement } from "@/lib/markdownPreprocess/utils";

// Matches the "[^label]: " prefix on the first line of a footnote definition.
const FOOTNOTE_DEF_PREFIX_RE = /^\[\^[^\]]+\]:\s*/;

// Matches leading 4-space or 1-tab indentation on continuation lines.
const CONTINUATION_INDENT_RE = /^(?:    |\t)/;

/**
 * Walk a flat token array and collect the line range (0-indexed, endLine
 * exclusive) spanned by the content of a single footnote definition.
 *
 * markdown-it's `footnote_open` token is synthesised by the `footnote_tail`
 * core rule and therefore has no `map` of its own.  The child paragraph
 * tokens (created during block parsing) do carry `map` data, so we derive
 * the definition's extent from those.
 *
 * Returns `null` when no child token with valid map data is found.
 */
const getFootnoteLineRange = (
  tokens: Array<{ type: string; map: [number, number] | null; meta: unknown }>,
  footnoteOpenIdx: number,
): { startLine: number; endLine: number } | null => {
  let minStart: number | null = null;
  let maxEnd: number | null = null;
  // Start at depth 1: we have already entered the footnote_open at footnoteOpenIdx.
  let depth = 1;

  for (let i = footnoteOpenIdx + 1; i < tokens.length; i++) {
    const token = tokens[i]!;

    if (token.type === "footnote_open") {
      depth++;
    } else if (token.type === "footnote_close") {
      depth--;
      if (depth === 0) break; // reached our matching close
    }

    if (token.map !== null && Array.isArray(token.map)) {
      const [lineStart, lineEnd] = token.map as [number, number];
      if (minStart === null || lineStart < minStart) minStart = lineStart;
      if (maxEnd === null || lineEnd > maxEnd) maxEnd = lineEnd;
    }
  }

  if (minStart === null || maxEnd === null) return null;
  return { startLine: minStart, endLine: maxEnd };
};

/**
 * Strip leading 4-space or 1-tab indentation from a continuation line.
 * Blank lines are left untouched.
 */
const stripContinuationIndent = (line: string): string => {
  if (line.trim() === "") return line;
  return line.replace(CONTINUATION_INDENT_RE, "");
};

/**
 * Returns a new array with trailing blank lines removed.
 */
const trimTrailingBlankLines = (lines: string[]): string[] => {
  let last = lines.length - 1;
  while (last >= 0 && lines[last]!.trim() === "") last--;
  return lines.slice(0, last + 1);
};

/**
 * MarkdownPreprocessRule that rewrites footnote definitions from their native
 * markdown syntax to a fenced intermediate form:
 *
 *   Input:
 *     [^1]: This is the footnote content.
 *
 *         Second paragraph with 4-space indent.
 *
 *   Output:
 *     <footnote-def id="1">
 *     This is the footnote content.
 *
 *     Second paragraph with 4-space indent.
 *     </footnote-def>
 *
 * Inline references ([^label]) are NOT touched — those are handled downstream
 * by a Lexical TextMatchTransformer.
 *
 * NOTE — orphan definitions: `markdown-it-footnote` only emits
 * `footnote_open` tokens for definitions that have at least one corresponding
 * inline reference (`[^label]`) elsewhere in the document. A definition whose
 * label is never referenced (e.g. `[^x]: content` with no `[^x]` in the
 * text) does NOT produce a token and is therefore NOT replaced here — it
 * passes through as raw markdown text.
 */
export const collectFootnoteReplacements: MarkdownPreprocessRule = ({
  markdown,
}): MarkdownReplacement[] => {
  const tokens = getMarkdownItInstance().parse(markdown, {});
  const replacements: MarkdownReplacement[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type !== "footnote_open") continue;

    const label: string | undefined = token.meta?.label;
    if (typeof label !== "string") continue;

    // Derive the definition's line range from its child tokens.
    const lineRange = getFootnoteLineRange(tokens, i);
    // Empty footnote body — no paragraph tokens found; skip silently.
    // These produce no child content for FootnoteDefinitionNode.
    if (lineRange === null) continue;

    const { start, end } = lineRangeToOffsets(markdown, lineRange.startLine, lineRange.endLine);

    if (!hasValidOffsets(start, end) || start === end) continue;

    // Extract the raw source lines for this definition.
    const raw = markdown.slice(start, end);
    const rawLines = raw.split("\n");

    // Strip the "[^label]: " prefix from the first line.
    const [firstLine, ...restLines] = rawLines;
    const firstContent = (firstLine ?? "").replace(FOOTNOTE_DEF_PREFIX_RE, "");

    // Strip 4-space / tab indentation from continuation lines (not blank lines).
    const processedRest = restLines.map(stripContinuationIndent);

    // Reassemble and trim trailing blank lines.
    const allLines = trimTrailingBlankLines([firstContent, ...processedRest]);
    const content = allLines.join("\n");

    const safeLabel = label.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const replacement = `<footnote-def id="${safeLabel}">\n${content}\n</footnote-def>`;

    pushReplacement(replacements, { start, end, replacement });
  }

  return replacements;
};
