import {
  convertLexicalToMarkdown,
  editorConfigFactory,
  type SerializedEditorState,
} from "@payloadcms/richtext-lexical";
import type { CollectionAfterReadHook } from "payload";

export const addContentMarkdown: CollectionAfterReadHook = async ({ doc, req }) => {
  const content = doc?.content as SerializedEditorState | undefined;

  if (!content || typeof content !== "object") {
    return doc;
  }

  try {
    const editorConfig = await editorConfigFactory.default({
      config: req.payload.config,
    });

    const markdown = convertLexicalToMarkdown({
      data: content,
      editorConfig,
    });

    return {
      ...doc,
      contentMarkdown: markdown,
    };
  } catch (error) {
    req.payload.logger.error({
      message: "Failed to generate markdown from lexical content",
      error,
      docId: doc?.id,
    });

    return doc;
  }
};
