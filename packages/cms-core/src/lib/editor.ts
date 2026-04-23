import {
  createBasicRichTextEditor as createEditorBasic,
  createDocumentRichTextEditor as createEditorDocument,
  createMinimalRichTextEditor as createEditorMinimal,
} from "@sidshub/cms-editor/cms";

import { EmojiShortcodesFeature } from "@/plugin/emoji-shortcodes/server";
import { MarkdownPasteFeature } from "@/plugin/markdown-paste/server";
import { FootnotesFeature } from "@/plugin/footnotes/server";
import { DefinitionListFeature } from "@/plugin/definition-list/server";
import { AbbreviationsFeature } from "@/plugin/abbreviations/server";

type BasicOptions = Parameters<typeof createEditorBasic>[0];

const withMarkdownPaste = (options: BasicOptions = {}): BasicOptions => {
  return {
    ...options,
    extraFeatures: [
      ...(options.extraFeatures ?? []),
      EmojiShortcodesFeature(),
      MarkdownPasteFeature(),
      FootnotesFeature(),
      DefinitionListFeature(),
      AbbreviationsFeature(),
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
