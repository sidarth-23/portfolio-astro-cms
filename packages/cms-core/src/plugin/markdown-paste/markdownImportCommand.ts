import { createCommand, type LexicalCommand } from "@payloadcms/richtext-lexical/lexical";

export type OpenMarkdownImportPayload = {
  markdown?: string;
};

export const OPEN_MARKDOWN_IMPORT_COMMAND: LexicalCommand<OpenMarkdownImportPayload | undefined> =
  createCommand("OPEN_MARKDOWN_IMPORT_COMMAND");
