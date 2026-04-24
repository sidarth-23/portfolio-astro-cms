import { createRichTextRenderer } from "./shared/render";
import type { BlockComponents } from "./types";
import { daisyuiComponents } from "./daisyui";
import { tailwindComponents } from "./tailwind";

export const themeComponents = {
  daisyui: daisyuiComponents,
  tailwind: tailwindComponents,
} as const satisfies Record<string, BlockComponents>;

export type RichTextTheme = keyof typeof themeComponents;

export function getThemeComponents(theme: RichTextTheme = "daisyui"): BlockComponents {
  return themeComponents[theme];
}

export function createThemeRichTextRenderer(theme: RichTextTheme = "daisyui") {
  return createRichTextRenderer(getThemeComponents(theme));
}

export const { renderRichTextToHTML, renderBlock, renderBlocks } = createThemeRichTextRenderer();

export * from "./shared/render";
export * from "../util/headings";
export * from "../util/linkResolver";
export * from "./types";
