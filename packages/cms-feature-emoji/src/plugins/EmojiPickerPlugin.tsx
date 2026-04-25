"use client";

import { useEffect, useState } from "react";
import { COMMAND_PRIORITY_EDITOR } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { OPEN_EMOJI_PICKER_COMMAND } from "./emojiPickerCommand";
import { EmojiPickerPopover } from "./EmojiPickerPopover";

export function EmojiPickerPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_EMOJI_PICKER_COMMAND,
      () => {
        setIsOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return <EmojiPickerPopover editor={editor} isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
