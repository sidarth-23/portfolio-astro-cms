import { createRichTextRenderer } from "./shared/render";
import type { BlockComponents } from "./types";
import { daisyuiComponents, tableClasses as daisyuiTableClasses } from "./daisyui";
import { tailwindComponents, tableClasses as tailwindTableClasses } from "./tailwind";

export const themeComponents = {
  daisyui: daisyuiComponents,
  tailwind: tailwindComponents,
} as const satisfies Record<string, BlockComponents>;

const themeTableClasses = {
  daisyui: daisyuiTableClasses,
  tailwind: tailwindTableClasses,
} as const;

export type RichTextTheme = keyof typeof themeComponents;

export function getThemeComponents(theme: RichTextTheme = "daisyui"): BlockComponents {
  return themeComponents[theme];
}

export function createThemeRichTextRenderer(theme: RichTextTheme = "daisyui") {
  return createRichTextRenderer(getThemeComponents(theme), {
    tableClasses: themeTableClasses[theme],
  });
}

export const { renderRichTextToHTML, renderBlock, renderBlocks } = createThemeRichTextRenderer();

export * from "./shared/render";
export * from "../util/headings";
export * from "../util/linkResolver";
export * from "./types";
