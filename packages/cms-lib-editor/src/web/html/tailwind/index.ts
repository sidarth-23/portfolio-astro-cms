import { createRichTextRenderer } from "@/web/html/shared/render";
import type { BlockComponents } from "@/web/html/types";
import type { TableClassConfig } from "@/web/util/table";
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

export * from "@/web/html/shared/render";
export * from "@/web/html/types";
