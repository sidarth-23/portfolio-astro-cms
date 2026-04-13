import { createElement } from "react";
import satori from "satori";
import sharp from "sharp";

import type { OgTemplateProps } from "./ogTemplate";
import { OgTemplate } from "./ogTemplate";
import { loadOgFonts } from "./loadFonts";

export type RenderOgImageOptions = OgTemplateProps;

export async function renderOgImage(options: RenderOgImageOptions): Promise<Buffer> {
  const fonts = await loadOgFonts();

  const element = createElement(OgTemplate, options);

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts,
  });

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return pngBuffer;
}
