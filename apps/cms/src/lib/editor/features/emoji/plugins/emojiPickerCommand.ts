import { createCommand, type LexicalCommand } from "@payloadcms/richtext-lexical/lexical";

export const OPEN_EMOJI_PICKER_COMMAND: LexicalCommand<undefined> = createCommand(
  "OPEN_EMOJI_PICKER_COMMAND",
);
