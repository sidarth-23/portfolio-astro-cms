import type { MarkdownPreprocessRule } from "../types";

import { collectFootnoteReplacements } from "./footnotes";
import { collectImageGalleryReplacements } from "./imageGallery";
import { collectSmartTypographyReplacements } from "./smartTypography";
import { collectThematicBreakReplacements } from "./thematicBreak";

export const MARKDOWN_PREPROCESS_RULES: MarkdownPreprocessRule[] = [
  collectFootnoteReplacements,
  collectImageGalleryReplacements,
  collectThematicBreakReplacements,
  collectSmartTypographyReplacements,
];
