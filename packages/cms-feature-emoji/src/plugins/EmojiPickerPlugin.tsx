"use client";

import { useEffect } from "react";
import { COMMAND_PRIORITY_EDITOR } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDrawerSlug, useModal } from "@payloadcms/ui";

import { OPEN_EMOJI_PICKER_COMMAND } from "./emojiPickerCommand";
import { EmojiPickerDrawer } from "./EmojiPickerDrawer";

export function EmojiPickerPlugin() {
  const [editor] = useLexicalComposerContext();
  const drawerSlug = useDrawerSlug("emoji-picker");
  const { openModal } = useModal();

  useEffect(() => {
    return editor.registerCommand(
      OPEN_EMOJI_PICKER_COMMAND,
      () => {
        openModal(drawerSlug);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [drawerSlug, editor, openModal]);

  return <EmojiPickerDrawer drawerSlug={drawerSlug} editor={editor} />;
}
