import type { ComponentType } from "preact";
import type { UploadDoc } from "./image-utils";

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

export type BlockComponents = {
  Callout: ComponentType<CalloutProps>;
  Code: ComponentType<CodeProps>;
  ImageGallery: ComponentType<ImageGalleryProps>;
  Upload: ComponentType<UploadProps>;
};
