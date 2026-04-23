import type { MarkdownPreprocessRule, MarkdownReplacement } from "@/lib/markdownPreprocess/types";
import {
  getMarkdownItInstance,
  lineRangeToOffsets,
} from "@/lib/markdownPreprocess/markdownItUtils";
import { hasValidOffsets, pushReplacement } from "@/lib/markdownPreprocess/utils";

/**
 * MarkdownPreprocessRule that rewrites definition lists from their native
 * markdown syntax (markdown-it-deflist format) to a fenced intermediate form:
 *
 *   Input:
 *     Apple
 *     : Red fruit
 *     : Also tasty
 *
 *     Orange
 *     : Orange fruit
 *
 *   Output:
 *     <deflist>
 *     <dt>Apple</dt>
 *     <dd>Red fruit</dd>
 *     <dd>Also tasty</dd>
 *     <dt>Orange</dt>
 *     <dd>Orange fruit</dd>
 *     </deflist>
 *
 * The `dl_open` token has a `map: [startLine, endLine]` covering the full
 * block extent. We walk the token stream between each `dl_open`/`dl_close`
 * pair to collect dt/dd inline content, then rewrite the source range.
 */
export const collectDefinitionListReplacements: MarkdownPreprocessRule = ({
  markdown,
}): MarkdownReplacement[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokens: Array<any> = getMarkdownItInstance().parse(markdown, {});
  const replacements: MarkdownReplacement[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type !== "dl_open") continue;

    // dl_open has a map covering the entire definition list block.
    const dlMap: [number, number] | null = token.map;
    if (!dlMap || !Array.isArray(dlMap)) continue;

    const [startLine, endLine] = dlMap;

    const { start, end } = lineRangeToOffsets(markdown, startLine, endLine);
    if (!hasValidOffsets(start, end) || start === end) continue;

    // Walk tokens inside this dl_open...dl_close to collect dt/dd content.
    // We track the state machine: are we inside a dt or dd block?
    type ItemType = "dt" | "dd";
    const items: { kind: ItemType; content: string }[] = [];

    let j = i + 1;
    let depth = 1;

    while (j < tokens.length && depth > 0) {
      const t = tokens[j]!;

      if (t.type === "dl_open") {
        depth++;
      } else if (t.type === "dl_close") {
        depth--;
      } else if (depth === 1) {
        // Only process direct children of this dl
        if (t.type === "inline") {
          // Look back to find the parent open tag (dt_open or paragraph inside dd)
          // We track what we're currently collecting by the preceding open token
          const prevOpen = findPrecedingOpen(tokens, j);
          if (prevOpen === "dt") {
            items.push({ kind: "dt", content: t.content });
          } else if (prevOpen === "dd") {
            items.push({ kind: "dd", content: t.content });
          }
        }
      }

      j++;
    }

    if (items.length === 0) continue;

    // Build the fenced replacement
    const lines: string[] = ["<deflist>"];
    for (const item of items) {
      const escaped = escapeContent(item.content);
      lines.push(`<${item.kind}>${escaped}</${item.kind}>`);
    }
    lines.push("</deflist>");
    const replacement = lines.join("\n");

    pushReplacement(replacements, { start, end, replacement });
  }

  return replacements;
};

/**
 * Walk backwards from an `inline` token to find the most recent `dt_open`
 * or `dd_open` (via `paragraph_open` inside a `dd`). Returns "dt", "dd", or
 * null if neither is the direct parent context.
 */
const findPrecedingOpen = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokens: Array<any>,
  inlineIdx: number,
): "dt" | "dd" | null => {
  // Walk backwards to find the nearest relevant open tag
  for (let k = inlineIdx - 1; k >= 0; k--) {
    const t = tokens[k]!;
    if (t.type === "dt_open") return "dt";
    if (t.type === "dd_open") return "dd";
    if (t.type === "paragraph_open") {
      // paragraph inside a dd — look further back for the dd_open
      for (let m = k - 1; m >= 0; m--) {
        const t2 = tokens[m]!;
        if (t2.type === "dd_open") return "dd";
        if (t2.type === "dt_open" || t2.type === "dl_open") break;
      }
      return null;
    }
    // Stop at any block-level close/open that would end the context
    if (
      t.type === "dt_close" ||
      t.type === "dd_close" ||
      t.type === "paragraph_close" ||
      t.type === "dl_close"
    ) {
      break;
    }
  }
  return null;
};

/**
 * Escape `<` and `>` characters in term/description content so that the
 * fenced representation stays unambiguous. The transformer will unescape
 * on import.
 */
const escapeContent = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
