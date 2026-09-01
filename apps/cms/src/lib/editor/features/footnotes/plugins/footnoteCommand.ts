import { createCommand, type LexicalCommand } from "@payloadcms/richtext-lexical/lexical";

export type OpenFootnoteModalPayload = {
  focusId?: string;
};

export const OPEN_FOOTNOTE_MODAL_COMMAND: LexicalCommand<OpenFootnoteModalPayload | undefined> =
  createCommand("OPEN_FOOTNOTE_MODAL_COMMAND");
