"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  Collapsible,
  FieldDescription,
  FieldLabel,
  TextareaInput,
  fieldBaseClass,
} from "@payloadcms/ui";
import { $addUpdateTag } from "lexical";

import {
  normalizeFootnotes,
  readFootnoteSnapshot,
  syncReferenceDom,
  updateFootnoteDefinitionText,
  type FootnotePanelEntry,
} from "./footnoteState";

const FOOTNOTE_NORMALIZE_TAG = "footnotes:normalize";

type PanelState = {
  displayIndexById: Record<string, number>;
  entries: FootnotePanelEntry[];
};

const emptyPanelState: PanelState = {
  displayIndexById: {},
  entries: [],
};

export function FootnoteEntriesPanelPlugin() {
  const [editor] = useLexicalComposerContext();
  const [panelState, setPanelState] = useState<PanelState>(emptyPanelState);

  useEffect(() => {
    const initialState = editor.getEditorState().read(() => readFootnoteSnapshot());
    setPanelState({
      displayIndexById: initialState.displayIndexById,
      entries: initialState.entries,
    });

    return editor.registerUpdateListener(({ editorState, tags }) => {
      const snapshot = editorState.read(() => readFootnoteSnapshot());

      setPanelState({
        displayIndexById: snapshot.displayIndexById,
        entries: snapshot.entries,
      });

      if (snapshot.shouldNormalize && !tags.has(FOOTNOTE_NORMALIZE_TAG)) {
        editor.update(() => {
          normalizeFootnotes();
          $addUpdateTag(FOOTNOTE_NORMALIZE_TAG);
        });
      }
    });
  }, [editor]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      syncReferenceDom(editor, panelState.displayIndexById);
    });

    return () => cancelAnimationFrame(frame);
  }, [editor, panelState.displayIndexById, panelState.entries]);

  const onChangeEntry = useCallback(
    (id: string, text: string) => {
      editor.update(() => {
        updateFootnoteDefinitionText(id, text);
      });
    },
    [editor],
  );

  const entries = useMemo(() => panelState.entries, [panelState.entries]);

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

      {entries.length === 0 ? (
        <p style={{ margin: "0.4rem 0 0", opacity: 0.8 }}>No footnotes yet.</p>
      ) : (
        <div className="array-field__draggable-rows">
          {entries.map((entry) => {
            const encodedId = encodeURIComponent(entry.id);

            return (
              <div key={entry.id} id={`fn-${encodedId}`}>
                <Collapsible
                  className="array-field__row array-field__row--no-errors"
                  header={
                    <div className="array-field__row-header">{`${entry.displayIndex}. ${entry.id}`}</div>
                  }
                  initCollapsed={false}
                >
                  <div className="array-field__fields">
                    <TextareaInput
                      label="Content"
                      path={`footnotes.${entry.id}`}
                      rows={3}
                      value={entry.text}
                      onChange={(event) => {
                        onChangeEntry(entry.id, event.target.value);
                      }}
                    />
                  </div>
                </Collapsible>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
