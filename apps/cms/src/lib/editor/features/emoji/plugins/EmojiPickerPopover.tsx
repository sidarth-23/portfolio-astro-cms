"use client";

import { createPortal } from "react-dom";
import type { LexicalEditor } from "lexical";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

type EmojiPickerPopoverProps = {
  editor: LexicalEditor;
  isOpen: boolean;
  onClose: () => void;
};

type SelectedEmoji = {
  native: string;
};

export function EmojiPickerPopover({ editor, isOpen, onClose }: EmojiPickerPopoverProps) {
  if (!isOpen) {
    return null;
  }

  const handleEmojiSelect = (emoji: SelectedEmoji) => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selection.insertNodes([$createTextNode(emoji.native)]);
      } else {
        $getRoot().append($createParagraphNode().append($createTextNode(emoji.native)));
      }
    });

    onClose();
  };

  return createPortal(
    <div
      style={{
        alignItems: "center",
        background: "rgba(0, 0, 0, 0.5)",
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        left: 0,
        position: "fixed",
        right: 0,
        top: 0,
        zIndex: 9999,
      }}
    >
      <Picker data={data} theme="dark" onEmojiSelect={handleEmojiSelect} onClickOutside={onClose} />
    </div>,
    document.body,
  );
}
