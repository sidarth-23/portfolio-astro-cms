import { createRichTextRenderer } from "../render";
import type { BlockComponents } from "../types";
import { Callout } from "./Callout";
import { Code } from "./Code";
import { ImageGallery } from "./ImageGallery";
import { Upload } from "./Upload";

const components: BlockComponents = { Callout, Code, ImageGallery, Upload };

export const { renderRichTextToHTML, renderBlock, renderBlocks } = createRichTextRenderer(components);

export { components as tailwindComponents };

export type { RichTextRenderConfig } from "../render";
export type {
  BlockComponents,
  CalloutProps,
  CalloutVariantProfile,
  CodeProps,
  CodeSingleProps,
  CodeMultipleProps,
  GalleryImage,
  ImageGalleryProps,
  RichTextRenderOptions,
  RichTextValue,
  TableOfContentsItem,
  UploadProps,
} from "../types";
