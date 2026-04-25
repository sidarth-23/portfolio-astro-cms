"use client";

import { useCallback, useEffect } from "react";
import { COMMAND_PRIORITY_EDITOR } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDrawerSlug, useModal } from "@payloadcms/ui";

import { OPEN_FOOTNOTE_MODAL_COMMAND } from "./footnoteCommand";
import { FootnoteModal } from "./FootnoteModal";
import { useFootnoteController } from "./useFootnoteController";

export function FootnotePlugin() {
  const [editor] = useLexicalComposerContext();
  const drawerSlug = useDrawerSlug("footnote-insert");
  const { openModal } = useModal();
  const controller = useFootnoteController({ drawerSlug, editor });
  const { refreshFromEditor } = controller;

  const openFootnoteModal = useCallback(() => {
    refreshFromEditor();
    openModal(drawerSlug);
  }, [drawerSlug, openModal, refreshFromEditor]);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_FOOTNOTE_MODAL_COMMAND,
      () => {
        openFootnoteModal();
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, openFootnoteModal]);

  return <FootnoteModal controller={controller} drawerSlug={drawerSlug} />;
}
