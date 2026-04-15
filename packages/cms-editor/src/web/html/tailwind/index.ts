import { createRichTextRenderer } from "@/web/html/render";
import type { BlockComponents } from "@/web/html/types";
import { Callout } from "./Callout";
import { Code } from "./Code";
import { ImageGallery } from "./ImageGallery";
import { Upload } from "./Upload";

const components: BlockComponents = { Callout, Code, ImageGallery, Upload };

export const { renderRichTextToHTML, renderBlock, renderBlocks } =
  createRichTextRenderer(components);

export { components as tailwindComponents };

export * from "@/web/html/render";
export * from "@/web/html/types";
