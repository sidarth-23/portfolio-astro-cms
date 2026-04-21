"use client";

import { useCallback, useEffect, useState } from "react";
import { COMMAND_PRIORITY_EDITOR } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDrawerSlug, useModal } from "@payloadcms/ui";

import { OPEN_MARKDOWN_IMPORT_COMMAND } from "@/plugin/markdown-paste/markdownImportCommand";
import { MarkdownImportSheet } from "@/plugin/markdown-paste/MarkdownImportSheet";

export function MarkdownImportPlugin() {
  const [editor] = useLexicalComposerContext();
  const drawerSlug = useDrawerSlug("markdown-import");
  const { openModal } = useModal();

  const [initialMarkdown, setInitialMarkdown] = useState("");

  const handleClose = useCallback(() => {
    setInitialMarkdown("");
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_MARKDOWN_IMPORT_COMMAND,
      (payload) => {
        setInitialMarkdown(payload?.markdown ?? "");
        openModal(drawerSlug);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [drawerSlug, editor, openModal]);

  return (
    <MarkdownImportSheet
      drawerSlug={drawerSlug}
      initialMarkdown={initialMarkdown}
      onClose={handleClose}
    />
  );
}
