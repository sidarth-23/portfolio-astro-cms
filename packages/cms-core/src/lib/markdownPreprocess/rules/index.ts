import type { MarkdownPreprocessRule } from "@/lib/markdownPreprocess/types";

import { collectImageGalleryReplacements } from "@/lib/markdownPreprocess/rules/imageGallery";
import { collectSmartTypographyReplacements } from "@/lib/markdownPreprocess/rules/smartTypography";
import { collectThematicBreakReplacements } from "@/lib/markdownPreprocess/rules/thematicBreak";

/**
 * Ordered list of markdown preprocess rules.
 *
 * ARCHITECTURE — single-pass, first-writer-wins
 * ─────────────────────────────────────────────
 * All rules receive the *same* original markdown string and mdast AST; they do
 * not see each other's output. Each rule appends offset-based replacements via
 * `pushReplacement` (utils.ts). If two rules claim overlapping source ranges,
 * the earlier rule's replacement wins — the later one is silently discarded.
 *
 * ORDERING TIERS (top → bottom in this array)
 * ────────────────────────────────────────────
 * 1. Complex-syntax rules  — rules that own multi-line or structured blocks
 *    (footnotes, definition lists, abbreviations, …).  These must run first so
 *    their source ranges are claimed before any other rule can overlap them.
 *    *** INSERT NEW Phase 2+ rules HERE, before imageGallery ***
 *
 * 2. Structural rules      — block-level rewrites that don't produce inline
 *    markup (e.g. `collectImageGalleryReplacements`).
 *
 * 3. Normalization rules   — syntactic cleanup with no content change
 *    (e.g. `collectThematicBreakReplacements`).
 *
 * 4. Text-level rules      — character-for-character substitutions applied
 *    last so they never clobber structural replacements
 *    (e.g. `collectSmartTypographyReplacements`).
 *
 * ADDING A NEW RULE
 * ─────────────────
 * 1) Create `rules/<name>.ts` exporting a `MarkdownPreprocessRule`.
 * 2) Import it here and insert it at the correct tier above.
 */
export const MARKDOWN_PREPROCESS_RULES: MarkdownPreprocessRule[] = [
  collectImageGalleryReplacements,
  collectThematicBreakReplacements,
  collectSmartTypographyReplacements,
];
