import type { MarkdownPreprocessRule, MarkdownReplacement } from "../types";
import { hasValidOffsets, pushReplacement } from "../utils";

// Matches the "[^label]: " prefix on the first line of a footnote definition.
const FOOTNOTE_DEF_PREFIX_RE = /^\[\^[^\]]+\]:\s*/;

// Matches leading 4-space or 1-tab indentation on continuation lines.
const CONTINUATION_INDENT_RE = /^(?:    |\t)/;

type FootnoteDefinitionNodeLike = {
  type: "footnoteDefinition";
  identifier?: string;
  label?: string;
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isFootnoteDefinitionNode = (value: unknown): value is FootnoteDefinitionNodeLike => {
  if (!isRecord(value)) {
    return false;
  }

  return value.type === "footnoteDefinition";
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
 * Includes both referenced and unreferenced definitions because it relies on
 * mdast's `footnoteDefinition` nodes instead of markdown-it-footnote tokens.
 */
export const collectFootnoteReplacements: MarkdownPreprocessRule = ({
  markdown,
  root,
}): MarkdownReplacement[] => {
  const replacements: MarkdownReplacement[] = [];

  for (const node of root.children) {
    if (!isFootnoteDefinitionNode(node)) continue;

    const label =
      typeof node.label === "string" && node.label.length > 0
        ? node.label
        : typeof node.identifier === "string"
          ? node.identifier
          : undefined;
    if (!label) continue;

    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;

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

    pushReplacement(replacements, { start: start as number, end: end as number, replacement });
  }

  return replacements;
};
