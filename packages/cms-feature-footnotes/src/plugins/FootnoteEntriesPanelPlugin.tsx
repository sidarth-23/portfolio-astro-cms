"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  Collapsible,
  FieldDescription,
  FieldLabel,
  TextareaInput,
  fieldBaseClass,
} from "@payloadcms/ui";
import { $addUpdateTag, SKIP_DOM_SELECTION_TAG } from "lexical";

import {
  isReferencePresentationOutdated,
  normalizeFootnotes,
  readFootnoteSnapshot,
  syncReferencePresentation,
  updateFootnoteDefinitionText,
  type FootnotePanelEntry,
} from "./footnoteState";

const FOOTNOTE_NORMALIZE_TAG = "footnotes:normalize";
const FOOTNOTE_REFERENCE_SYNC_TAG = "footnotes:reference-sync";
const FOOTNOTE_TEXT_EDIT_TAG = "footnotes:text-edit";

type PanelState = {
  displayIndexById: Record<string, number>;
  entries: FootnotePanelEntry[];
};

const emptyPanelState: PanelState = {
  displayIndexById: {},
  entries: [],
};

// ─── Per-row component ────────────────────────────────────────────────────────
// Each row owns its own text state so parent re-renders never reset a
// keystroke mid-flight. External changes (undo, paste, structural edits) are
// reflected by watching the `initialText` prop and only applying it when the
// most-recent change came from outside (not from the user typing).

type FootnoteEntryRowProps = {
  displayIndex: number;
  entryId: string;
  initialText: string;
  onChangeEntry: (id: string, text: string) => void;
};

const FootnoteEntryRow = React.memo(function FootnoteEntryRow({
  displayIndex,
  entryId,
  initialText,
  onChangeEntry,
}: FootnoteEntryRowProps) {
  const [text, setText] = useState(initialText);
  // Tracks whether the most-recent text change originated from this row so
  // we can skip the prop→state sync for our own edits.
  const isLocalEdit = useRef(false);

  useEffect(() => {
    if (!isLocalEdit.current) {
      setText(initialText);
    }
    isLocalEdit.current = false;
  }, [initialText]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = event.target.value;
      isLocalEdit.current = true;
      setText(newText);
      onChangeEntry(entryId, newText);
    },
    [entryId, onChangeEntry],
  );

  const encodedId = encodeURIComponent(entryId);

  return (
    <div id={`fn-${encodedId}`}>
      <Collapsible
        className="array-field__row array-field__row--no-errors"
        header={<div className="array-field__row-header">{`${displayIndex}. ${entryId}`}</div>}
        initCollapsed={false}
      >
        <div className="array-field__fields">
          <TextareaInput
            label="Content"
            path={`footnotes.${entryId}`}
            rows={3}
            value={text}
            onChange={handleChange}
          />
        </div>
      </Collapsible>
    </div>
  );
});

// ─── Panel plugin ─────────────────────────────────────────────────────────────

export function FootnoteEntriesPanelPlugin() {
  const [editor] = useLexicalComposerContext();
  const [panelState, setPanelState] = useState<PanelState>(emptyPanelState);
  // Tracks the last entries array committed to state so the update listener
  // can skip no-op renders caused by cascading normalize/sync updates.
  const prevEntriesRef = useRef<FootnotePanelEntry[]>([]);

  const onChangeEntry = useCallback(
    (id: string, text: string) => {
      editor.update(
        () => {
          updateFootnoteDefinitionText(id, text);
          $addUpdateTag(FOOTNOTE_TEXT_EDIT_TAG);
        },
        { tag: SKIP_DOM_SELECTION_TAG },
      );
    },
    [editor],
  );

  useEffect(() => {
    const initialState = editor.getEditorState().read(() => {
      const snapshot = readFootnoteSnapshot();
      return {
        ...snapshot,
        shouldSyncReferences: isReferencePresentationOutdated(snapshot.displayIndexById),
      };
    });

    prevEntriesRef.current = initialState.entries;
    setPanelState({
      displayIndexById: initialState.displayIndexById,
      entries: initialState.entries,
    });

    if (initialState.shouldSyncReferences) {
      editor.update(
        () => {
          syncReferencePresentation(initialState.displayIndexById);
          $addUpdateTag(FOOTNOTE_REFERENCE_SYNC_TAG);
        },
        { tag: SKIP_DOM_SELECTION_TAG },
      );
    }

    return editor.registerUpdateListener(({ editorState, tags }) => {
      const snapshot = editorState.read(() => {
        const nextSnapshot = readFootnoteSnapshot();
        return {
          ...nextSnapshot,
          shouldSyncReferences: isReferencePresentationOutdated(nextSnapshot.displayIndexById),
        };
      });

      // Only re-render the panel when the entry list has structurally changed
      // (entries added/removed/reordered or text changed from an external
      // source). Skipping no-op updates prevents cascading normalize/sync
      // updates from triggering renders that would disrupt in-progress input.
      const prev = prevEntriesRef.current;
      const next = snapshot.entries;
      const structureChanged =
        prev.length !== next.length ||
        prev.some(
          (entry, i) =>
            entry.id !== next[i]?.id ||
            entry.displayIndex !== next[i]?.displayIndex ||
            entry.text !== next[i]?.text,
        );

      if (structureChanged) {
        prevEntriesRef.current = next;
        setPanelState({
          displayIndexById: snapshot.displayIndexById,
          entries: next,
        });
      }

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

  return (
    <div className={`${fieldBaseClass} array-field`} style={{ marginTop: "0.75rem" }}>
      <header className="array-field__header" style={{ gap: "0.25rem" }}>
        <div className="array-field__header-wrap">
          <div className="array-field__header-content">
            <h3 className="array-field__title">
              <FieldLabel as="span" label="Footnotes" />
            </h3>
          </div>
        </div>
        <FieldDescription
          description="Edit all footnote entries here. Entries without references are removed automatically."
          path="footnotes"
        />
      </header>

      {panelState.entries.length === 0 ? (
        <p style={{ margin: "0.4rem 0 0", opacity: 0.8 }}>No footnotes yet.</p>
      ) : (
        <div className="array-field__draggable-rows">
          {panelState.entries.map((entry) => (
            <FootnoteEntryRow
              key={entry.id}
              displayIndex={entry.displayIndex}
              entryId={entry.id}
              initialText={entry.text}
              onChangeEntry={onChangeEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
