"use client";

import { useCallback, useEffect } from "react";
import { COMMAND_PRIORITY_EDITOR, PASTE_COMMAND } from "@payloadcms/richtext-lexical/lexical";
import {
  $addUpdateTag,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  SKIP_DOM_SELECTION_TAG,
} from "lexical";
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from "@payloadcms/richtext-lexical/lexical/markdown";
import { FOOTNOTE_REFERENCE_TRANSFORMER } from "../transformers/footnoteReference";
import { FOOTNOTE_DEFINITION_TRANSFORMER } from "../transformers/footnoteDefinition";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useDrawerSlug, useModal } from "@payloadcms/ui";

import { OPEN_FOOTNOTE_MODAL_COMMAND } from "./footnoteCommand";
import { FootnoteModal } from "./FootnoteModal";
import { useFootnoteController } from "./useFootnoteController";
import {
  isReferencePresentationOutdated,
  normalizeFootnotes,
  readFootnoteSnapshot,
  syncReferencePresentation,
} from "./footnoteState";

const FOOTNOTE_NORMALIZE_TAG = "footnotes:normalize";
const FOOTNOTE_REFERENCE_SYNC_TAG = "footnotes:reference-sync";

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
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false;
        const text = event.clipboardData?.getData("text/plain") ?? "";
        if (!/\[\^[^\]]+\]/.test(text) && !/^\[\^[^\]]+\]:/m.test(text)) return false;

        event.preventDefault();
        editor.update(
          () => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const target = $createParagraphNode();
            $convertFromMarkdownString(
              text,
              [...TRANSFORMERS, FOOTNOTE_REFERENCE_TRANSFORMER, FOOTNOTE_DEFINITION_TRANSFORMER],
              target,
            );
            selection.insertNodes(target.getChildren());
            normalizeFootnotes();
            $addUpdateTag(FOOTNOTE_NORMALIZE_TAG);
          },
          { tag: SKIP_DOM_SELECTION_TAG },
        );
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

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

  // Normalization and reference-sync — runs headlessly; no UI rendered here.
  useEffect(() => {
    const initialDisplayIndexById = editor.getEditorState().read(() => {
      const snapshot = readFootnoteSnapshot();
      return {
        displayIndexById: snapshot.displayIndexById,
        shouldSyncReferences: isReferencePresentationOutdated(snapshot.displayIndexById),
      };
    });

    if (initialDisplayIndexById.shouldSyncReferences) {
      editor.update(
        () => {
          syncReferencePresentation(initialDisplayIndexById.displayIndexById);
          $addUpdateTag(FOOTNOTE_REFERENCE_SYNC_TAG);
        },
        { tag: SKIP_DOM_SELECTION_TAG },
      );
    }

    return editor.registerUpdateListener(({ editorState, tags }) => {
      const snapshot = editorState.read(() => {
        const next = readFootnoteSnapshot();
        return {
          ...next,
          shouldSyncReferences: isReferencePresentationOutdated(next.displayIndexById),
        };
      });

      if (snapshot.shouldNormalize && !tags.has(FOOTNOTE_NORMALIZE_TAG)) {
        editor.update(
          () => {
            normalizeFootnotes();
            $addUpdateTag(FOOTNOTE_NORMALIZE_TAG);
          },
          { tag: SKIP_DOM_SELECTION_TAG },
        );
      }

      if (snapshot.shouldSyncReferences && !tags.has(FOOTNOTE_REFERENCE_SYNC_TAG)) {
        editor.update(
          () => {
            syncReferencePresentation(snapshot.displayIndexById);
            $addUpdateTag(FOOTNOTE_REFERENCE_SYNC_TAG);
          },
          { tag: SKIP_DOM_SELECTION_TAG },
        );
      }
    });
  }, [editor]);

  return <FootnoteModal controller={controller} drawerSlug={drawerSlug} />;
}
