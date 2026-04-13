import type { SerializedEditorState } from "lexical";

export type RichTextValue = SerializedEditorState;
export type RichTextCssEngine = "daisyui";
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
