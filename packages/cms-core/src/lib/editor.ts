import {
  createBasicRichTextEditor as createEditorBasic,
  createDocumentRichTextEditor as createEditorDocument,
  createMinimalRichTextEditor as createEditorMinimal,
} from "@sidshub/cms-editor/cms";
import { EmojiFeature } from "@sidshub/cms-feature-emoji/server";
import { FootnotesFeature } from "@sidshub/cms-feature-footnotes/server";
import { MarkdownPasteFeature } from "@sidshub/cms-plugin-markdown-paste/server";

type BasicOptions = Parameters<typeof createEditorBasic>[0];

const withMarkdownPaste = (options: BasicOptions = {}): BasicOptions => {
  return {
    ...options,
    extraFeatures: [
      ...(options.extraFeatures ?? []),
      EmojiFeature(),
      MarkdownPasteFeature(),
      FootnotesFeature(),
    ],
  };
};

export const createMinimalRichTextEditor: typeof createEditorMinimal = (options = {}) => {
  return createEditorMinimal(withMarkdownPaste(options));
};

export const createBasicRichTextEditor: typeof createEditorBasic = (options = {}) => {
  return createEditorBasic(withMarkdownPaste(options));
};

export const createDocumentRichTextEditor: typeof createEditorDocument = (options = {}) => {
  return createEditorDocument(withMarkdownPaste(options));
};
