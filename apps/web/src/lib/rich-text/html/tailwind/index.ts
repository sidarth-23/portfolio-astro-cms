import { createRichTextRenderer } from "@/lib/rich-text/html/shared/render";
import type { BlockComponents } from "@/lib/rich-text/html/types";
import type { TableClassConfig } from "@/lib/rich-text/util/table";
import { Callout } from "./Callout";
import { Code } from "./Code";
import { Footnotes } from "./Footnotes";
import { ImageGallery } from "./ImageGallery";
import { Upload } from "./Upload";

const components: BlockComponents = { Callout, Code, Footnotes, ImageGallery, Upload };

export const tableClasses: TableClassConfig = {};

export const { renderRichTextToHTML, renderBlock, renderBlocks } = createRichTextRenderer(
  components,
  { tableClasses },
);

export { components as tailwindComponents };

export * from "@/lib/rich-text/html/shared/render";
export * from "@/lib/rich-text/html/types";
