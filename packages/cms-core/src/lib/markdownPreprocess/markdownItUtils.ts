import MarkdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";
import markdownItDeflist from "markdown-it-deflist";
import markdownItAbbr from "markdown-it-abbr";

// Lazy-initialised singleton so the plugins are only registered once.
let _instance: InstanceType<typeof MarkdownIt> | null = null;

/**
 * A single markdown-it instance with footnote, deflist, and abbr plugins.
 * Used by preprocessing rules that need to parse non-GFM syntax.
 */
export const getMarkdownItInstance = (): InstanceType<typeof MarkdownIt> => {
  if (_instance === null) {
    _instance = new MarkdownIt();
    _instance.use(markdownItFootnote);
    _instance.use(markdownItDeflist);
    _instance.use(markdownItAbbr);
  }
  return _instance;
};

/**
 * Convert 0-indexed line numbers (as returned by markdown-it token.map)
 * to byte offsets in the original markdown string.
 *
 * @param markdown   The full original markdown source.
 * @param startLine  First line of the range (inclusive, 0-indexed).
 * @param endLine    Line after the last line of the range (exclusive, 0-indexed).
 * @returns          `{ start, end }` byte offsets into `markdown`.
 */
export const lineRangeToOffsets = (
  markdown: string,
  startLine: number,
  endLine: number,
): { start: number; end: number } => {
  const lines = markdown.split("\n").map((l) => l.replace(/\r$/, ""));

  if (startLine >= lines.length) {
    return { start: markdown.length, end: markdown.length };
  }

  // Walk lines, accumulating cumulative byte positions (each line contributes
  // line.length + 1 bytes for the trailing '\n').
  let pos = 0;
  let start = 0;
  let end = 0;

  for (let i = 0; i < lines.length; i++) {
    if (i === startLine) {
      start = pos;
    }
    // endLine is exclusive: we want the byte just after lines[endLine - 1] ends.
    if (i === endLine - 1) {
      end = Math.min(pos + lines[i]!.length + 1, markdown.length);
    }
    pos += lines[i]!.length + 1; // +1 for '\n'
  }

  return { start, end };
};
