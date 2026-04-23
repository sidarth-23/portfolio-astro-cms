"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from "lexical";
import { useEffect } from "react";

import { OPEN_MARKDOWN_IMPORT_COMMAND } from "./markdownImportCommand";

export function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false;

        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        if (clipboardData.getData("application/x-lexical-editor")) return false;
        if (clipboardData.getData("text/html")) return false;

        const text = clipboardData.getData("text/plain");
        if (!text) return false;

        event.preventDefault();
        editor.dispatchCommand(OPEN_MARKDOWN_IMPORT_COMMAND, { markdown: text });

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
