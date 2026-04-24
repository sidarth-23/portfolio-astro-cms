import type { SerializedEditorState } from "lexical";
import type { ComponentType } from "preact";
import type { UploadDoc } from "@/web/util/image";

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

export type CodeSingleProps = {
  mode: "single";
  language: string;
  highlightedHtml: string;
  caption?: string | null;
};

export type CodeMultipleProps = {
  mode: "multiple";
  entries: Array<{ name: string; language: string; highlightedHtml: string }>;
  caption?: string | null;
};

export type CodeProps = CodeSingleProps | CodeMultipleProps;

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

export type BlockComponents = {
  Callout: ComponentType<CalloutProps>;
  Code: ComponentType<CodeProps>;
  Footnotes: ComponentType<FootnotesProps>;
  ImageGallery: ComponentType<ImageGalleryProps>;
  Upload: ComponentType<UploadProps>;
};
