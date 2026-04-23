import type { MarkdownPreprocessRule } from "@/lib/markdownPreprocess/types";

import { collectImageGalleryReplacements } from "@/lib/markdownPreprocess/rules/imageGallery";
import { collectSmartTypographyReplacements } from "@/lib/markdownPreprocess/rules/smartTypography";
import { collectThematicBreakReplacements } from "@/lib/markdownPreprocess/rules/thematicBreak";

/**
 * Add new preprocess rules by:
 * 1) creating `rules/<name>.ts` that exports a `MarkdownPreprocessRule`
 * 2) registering it in this list in the order it should run
 *
 * Rules should be offset-based and must return source replacements only for
 * markdown ranges they own.
 */
export const MARKDOWN_PREPROCESS_RULES: MarkdownPreprocessRule[] = [
  collectImageGalleryReplacements,
  collectThematicBreakReplacements,
  collectSmartTypographyReplacements,
];
