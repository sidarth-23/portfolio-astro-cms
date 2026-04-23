"use client";

import { useCallback, useMemo, useReducer } from "react";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { useModal } from "@payloadcms/ui";

import { $createFootnoteDefinitionNode } from "../nodes/FootnoteDefinitionNode.client";
import { $createFootnoteReferenceNode } from "../nodes/FootnoteReferenceNode.client";
import { readFootnoteSnapshot } from "./footnoteState";

type FootnoteEntry = {
  id: string;
  preview: string;
};

type FootnoteMode = "new" | "reuse";

type FootnoteState = {
  available: FootnoteEntry[];
  error: null | string;
  mode: FootnoteMode;
  selectedId: string;
  text: string;
};

type FootnoteAction =
  | { type: "reset"; available: FootnoteEntry[]; selectedId: string }
  | { type: "setMode"; value: FootnoteMode }
  | { type: "setSelectedId"; value: string }
  | { type: "setText"; value: string }
  | { type: "setError"; value: null | string };

type UseFootnoteControllerArgs = {
  drawerSlug: string;
  editor: LexicalEditor;
};

export type UseFootnoteControllerValue = {
  available: FootnoteEntry[];
  error: null | string;
  handleCancel: () => void;
  handleSubmit: () => void;
  mode: FootnoteMode;
  refreshFromEditor: () => void;
  selectedId: string;
  setMode: (value: FootnoteMode) => void;
  setSelectedId: (value: string) => void;
  setText: (value: string) => void;
  text: string;
};

const FOOTNOTE_ID_PREFIX = "fn";

const reducer = (state: FootnoteState, action: FootnoteAction): FootnoteState => {
  switch (action.type) {
    case "reset": {
      return {
        available: action.available,
        error: null,
        mode: "new",
        selectedId: action.selectedId,
        text: "",
      };
    }

    case "setMode": {
      return {
        ...state,
        error: null,
        mode: action.value,
      };
    }

    case "setSelectedId": {
      return {
        ...state,
        error: null,
        selectedId: action.value,
      };
    }

    case "setText": {
      return {
        ...state,
        error: null,
        text: action.value,
      };
    }

    case "setError": {
      return {
        ...state,
        error: action.value,
      };
    }

    default:
      return state;
  }
};

const createInitialState = (): FootnoteState => {
  return {
    available: [],
    error: null,
    mode: "new",
    selectedId: "",
    text: "",
  };
};

const formatPreview = (text: string): string => {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "(empty)";
  }
  return compact.length > 100 ? `${compact.slice(0, 97)}...` : compact;
};

const getFootnoteEntries = (editor: LexicalEditor): FootnoteEntry[] => {
  return editor.getEditorState().read(() => {
    const snapshot = readFootnoteSnapshot();
    return snapshot.entries.map((entry) => {
      return {
        id: entry.id,
        preview: `#${entry.displayIndex} ${formatPreview(entry.text)}`,
      };
    });
  });
};

const buildNextFootnoteId = (existingIds: Set<string>): string => {
  let counter = existingIds.size + 1;
  let candidate = `${FOOTNOTE_ID_PREFIX}-${counter}`;

  while (existingIds.has(candidate)) {
    counter += 1;
    candidate = `${FOOTNOTE_ID_PREFIX}-${counter}`;
  }

  return candidate;
};

export const useFootnoteController = ({
  drawerSlug,
  editor,
}: UseFootnoteControllerArgs): UseFootnoteControllerValue => {
  const { closeModal } = useModal();
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const resetFromEditorState = useCallback(() => {
    const available = getFootnoteEntries(editor);
    dispatch({
      type: "reset",
      available,
      selectedId: available[0]?.id ?? "",
    });
  }, [editor]);

  const setMode = useCallback((value: FootnoteMode) => {
    dispatch({ type: "setMode", value });
  }, []);

  const setSelectedId = useCallback((value: string) => {
    dispatch({ type: "setSelectedId", value });
  }, []);

  const setText = useCallback((value: string) => {
    dispatch({ type: "setText", value });
  }, []);

  const handleCancel = useCallback(() => {
    closeModal(drawerSlug);
    resetFromEditorState();
  }, [closeModal, drawerSlug, resetFromEditorState]);

  const handleSubmit = useCallback(() => {
    const text = state.text.trim();

    if (state.mode === "new" && text.length === 0) {
      dispatch({ type: "setError", value: "Footnote text is required for a new footnote." });
      return;
    }

    if (state.mode === "reuse" && state.selectedId.length === 0) {
      dispatch({ type: "setError", value: "Select an existing footnote to reuse." });
      return;
    }

    editor.update(() => {
      const root = $getRoot();
      const existingIds = new Set<string>();

      for (const node of root.getChildren()) {
        if (node.getType() !== "footnote-definition") {
          continue;
        }

        const withFootnote = node as unknown as { getFootnoteId?: () => string };
        const id = withFootnote.getFootnoteId?.();
        if (id) {
          existingIds.add(id);
        }
      }

      let footnoteId = state.selectedId;

      if (state.mode === "new") {
        footnoteId = buildNextFootnoteId(existingIds);
        const definitionNode = $createFootnoteDefinitionNode(footnoteId);
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        definitionNode.append(paragraph);
        root.append(definitionNode);
      }

      const selection = $getSelection();
      const refNode = $createFootnoteReferenceNode(footnoteId);

      if ($isRangeSelection(selection)) {
        $insertNodes([refNode]);
      } else {
        root.append($createParagraphNode().append(refNode));
      }
    });

    closeModal(drawerSlug);
    resetFromEditorState();
  }, [
    closeModal,
    drawerSlug,
    editor,
    resetFromEditorState,
    state.mode,
    state.selectedId,
    state.text,
  ]);

  const value = useMemo(() => {
    return {
      available: state.available,
      error: state.error,
      handleCancel,
      handleSubmit,
      mode: state.mode,
      refreshFromEditor: resetFromEditorState,
      selectedId: state.selectedId,
      setMode,
      setSelectedId,
      setText,
      text: state.text,
    };
  }, [
    handleCancel,
    handleSubmit,
    resetFromEditorState,
    setMode,
    setSelectedId,
    setText,
    state.available,
    state.error,
    state.mode,
    state.selectedId,
    state.text,
  ]);

  return value;
};
