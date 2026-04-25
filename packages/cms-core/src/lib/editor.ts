import {
  createBasicRichTextEditor as createEditorBasic,
  createDocumentRichTextEditor as createEditorDocument,
  createMinimalRichTextEditor as createEditorMinimal,
  DEFAULT_VARIANT_OPTIONS,
  type LexicalEditorVariant,
} from "@sidshub/cms-lib-editor/cms";
import { EmojiFeature } from "@sidshub/cms-feature-emoji/server";
import { FootnotesFeature } from "@sidshub/cms-feature-footnotes/server";
import { MarkdownPasteFeature } from "@sidshub/cms-feature-markdown-paste/server";

type BasicOptions = Parameters<typeof createEditorBasic>[0];

const withCustomFeatures = (
  variant: LexicalEditorVariant,
  options: BasicOptions = {},
): BasicOptions => {
  const defaults = DEFAULT_VARIANT_OPTIONS[variant];
  const enableEmoji = options.enableEmoji ?? defaults.enableEmoji ?? true;
  const enableFootnotes = options.enableFootnotes ?? defaults.enableFootnotes ?? false;
  const enableMarkdownPaste = options.enableMarkdownPaste ?? defaults.enableMarkdownPaste ?? false;

  const extraFeatures = [...(options.extraFeatures ?? [])];
  if (enableEmoji) extraFeatures.push(EmojiFeature());
  if (enableFootnotes) extraFeatures.push(FootnotesFeature());
  if (enableMarkdownPaste) extraFeatures.push(MarkdownPasteFeature());

  return { ...options, extraFeatures };
};

export const createMinimalRichTextEditor: typeof createEditorMinimal = (options = {}) => {
  return createEditorMinimal(withCustomFeatures("minimal", options));
};

export const createBasicRichTextEditor: typeof createEditorBasic = (options = {}) => {
  return createEditorBasic(withCustomFeatures("basic", options));
};

export const createDocumentRichTextEditor: typeof createEditorDocument = (options = {}) => {
  return createEditorDocument(withCustomFeatures("document", options));
};
