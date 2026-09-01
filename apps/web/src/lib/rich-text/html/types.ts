import type { SerializedEditorState } from "lexical";
import type { UploadDoc } from "@/lib/rich-text/util/image";

// Core value types
export type RichTextValue = SerializedEditorState;
export type CalloutVariantProfile = "generic" | "blog";

export type RichTextRenderOptions = {
  className?: string;
  data?: RichTextValue | null;
  enableContainer?: boolean;
};

export type TableOfContentsItem = {
  depth: 2 | 3;
  id: string;
  text: string;
};

// Block component prop types
export type CalloutProps = {
  variant: string;
  title?: string | null;
  contentHtml: string;
  /** Additional wrapper classes (e.g. `my-6` for inline lexical blocks) */
  wrapperClass?: string;
};

export type CodeProps = {
  language: string;
  highlightedHtml: string;
  caption?: string | null;
};

export type GalleryImage = {
  doc: UploadDoc;
  alt: string;
  captionHtml?: string | null;
};

export type ImageGalleryProps = {
  images: GalleryImage[];
  caption?: string | null;
  mediaBaseUrl?: string;
};

export type UploadProps = {
  doc: UploadDoc;
  alt: string;
  captionHtml?: string | null;
  mediaBaseUrl?: string;
};

export type FootnoteListItem = {
  id: string;
  bodyHtml: string;
  referenceHref?: string;
  referenceLabel?: string;
};

export type FootnotesProps = {
  title: string;
  items: FootnoteListItem[];
};
