"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  $addUpdateTag,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRangeSelection,
  $parseSerializedNode,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
  type SerializedLexicalNode,
} from "lexical";
import { toast, useConfig, useModal } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";

import {
  deriveAltFromUrl,
  getUniqueMarkdownImages,
  parseMarkdownImages,
} from "@/plugin/markdown-paste/markdownImageUtils";

type MarkdownImportState = {
  error: string | null;
  isImporting: boolean;
  isPreparing: boolean;
  markdown: string;
  preparedMediaByUrl: Record<string, string>;
  unresolvedImageUrls: string[];
};

type MarkdownImportAction =
  | { type: "reset"; value: string }
  | { type: "setError"; value: string | null }
  | { type: "setImporting"; value: boolean }
  | { type: "setPreparing"; value: boolean }
  | { type: "setMarkdown"; value: string }
  | { type: "setPreparedMedia"; url: string; value: null | string }
  | { type: "setUnresolved"; value: string[] }
  | { type: "mergePreparedMedia"; value: Record<string, string> };

type UseMarkdownImportControllerArgs = {
  collectionSlug?: string;
  drawerSlug: string;
  editor: LexicalEditor;
  fieldName: string;
  globalSlug?: string;
  initialMarkdown: string;
  onClose: () => void;
};

type ImportMediaResult =
  | {
      error?: undefined;
      mediaId: string;
      ok: true;
      url: string;
    }
  | {
      error?: string;
      ok: false;
      url: string;
    };

export type MarkdownImportControllerValue = {
  error: string | null;
  handleCancel: () => void;
  handleInsert: () => void;
  isImporting: boolean;
  isPreparing: boolean;
  markdown: string;
  prepareAllImages: () => void;
  prepareSingleImage: (url: string) => void;
  preparedMediaByUrl: Record<string, string>;
  setMarkdown: (value: string) => void;
  setPreparedMedia: (url: string, inputValue: unknown) => void;
  uniqueImages: Array<{ alt: string; url: string }>;
  unresolvedImageUrls: string[];
};

const createInitialState = (initialMarkdown: string): MarkdownImportState => {
  return {
    error: null,
    isImporting: false,
    isPreparing: false,
    markdown: initialMarkdown,
    preparedMediaByUrl: {},
    unresolvedImageUrls: [],
  };
};

const reducer = (state: MarkdownImportState, action: MarkdownImportAction): MarkdownImportState => {
  switch (action.type) {
    case "reset": {
      return createInitialState(action.value);
    }

    case "setError": {
      return {
        ...state,
        error: action.value,
      };
    }

    case "setImporting": {
      return {
        ...state,
        isImporting: action.value,
      };
    }

    case "setPreparing": {
      return {
        ...state,
        isPreparing: action.value,
      };
    }

    case "setMarkdown": {
      return {
        ...state,
        error: null,
        markdown: action.value,
        preparedMediaByUrl: {},
        unresolvedImageUrls: [],
      };
    }

    case "setPreparedMedia": {
      const next = { ...state.preparedMediaByUrl };

      if (!action.value) {
        delete next[action.url];
      } else {
        next[action.url] = action.value;
      }

      return {
        ...state,
        preparedMediaByUrl: next,
      };
    }

    case "mergePreparedMedia": {
      return {
        ...state,
        preparedMediaByUrl: {
          ...state.preparedMediaByUrl,
          ...action.value,
        },
      };
    }

    case "setUnresolved": {
      return {
        ...state,
        unresolvedImageUrls: action.value,
      };
    }

    default:
      return state;
  }
};

const resolveMediaId = (value: unknown): null | string => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const id = String(value).trim();
    return id.length > 0 ? id : null;
  }

  if (typeof value === "object") {
    const candidate = value as { id?: unknown; value?: unknown };

    if (candidate.id !== undefined) {
      return resolveMediaId(candidate.id);
    }

    if (candidate.value !== undefined) {
      return resolveMediaId(candidate.value);
    }
  }

  return null;
};

export const useMarkdownImportController = ({
  collectionSlug,
  drawerSlug,
  editor,
  fieldName,
  globalSlug,
  initialMarkdown,
  onClose,
}: UseMarkdownImportControllerArgs): MarkdownImportControllerValue => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const { closeModal, modalState } = useModal();

  const [state, dispatch] = useReducer(reducer, initialMarkdown, createInitialState);

  const isOpen = modalState[drawerSlug]?.isOpen ?? false;

  const imageMatches = useMemo(() => parseMarkdownImages(state.markdown), [state.markdown]);
  const uniqueImages = useMemo(() => getUniqueMarkdownImages(imageMatches), [imageMatches]);

  const imageByUrl = useMemo(() => {
    return new Map(uniqueImages.map((image) => [image.url, image]));
  }, [uniqueImages]);

  const mediaImportEndpoint = useMemo(() => {
    return formatAdminURL({ apiRoute: api, path: "/media-import-url" as `/${string}` });
  }, [api]);

  const convertMarkdownEndpoint = useMemo(() => {
    return formatAdminURL({ apiRoute: api, path: "/convert-markdown" as `/${string}` });
  }, [api]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    dispatch({ type: "reset", value: initialMarkdown });
  }, [initialMarkdown, isOpen]);

  const closeDrawer = useCallback(() => {
    closeModal(drawerSlug);
    onClose();
  }, [closeModal, drawerSlug, onClose]);

  const setMarkdown = useCallback((value: string) => {
    dispatch({ type: "setMarkdown", value });
  }, []);

  const setPreparedMedia = useCallback((url: string, inputValue: unknown) => {
    dispatch({
      type: "setPreparedMedia",
      url,
      value: resolveMediaId(inputValue),
    });
  }, []);

  const importMediaFromUrl = useCallback(
    async (url: string): Promise<ImportMediaResult> => {
      const image = imageByUrl.get(url);
      const alt = (image?.alt || deriveAltFromUrl(url)).trim();

      try {
        const response = await fetch(mediaImportEndpoint, {
          body: JSON.stringify({
            alt,
            updateExistingMetadata: false,
            url,
          }),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          mediaId?: number | string;
          ok?: boolean;
        };

        if (
          !response.ok ||
          payload.ok === false ||
          payload.mediaId === null ||
          payload.mediaId === undefined
        ) {
          return {
            error:
              typeof payload.error === "string" && payload.error.trim().length > 0
                ? payload.error
                : `Request failed with status ${response.status}`,
            ok: false,
            url,
          };
        }

        return {
          mediaId: String(payload.mediaId),
          ok: true,
          url,
        };
      } catch {
        return { error: "Network request failed.", ok: false, url };
      }
    },
    [imageByUrl, mediaImportEndpoint],
  );

  const prepareImageUrls = useCallback(
    async (urls: string[]) => {
      const uniqueUrls = Array.from(new Set(urls));
      if (uniqueUrls.length === 0) {
        return;
      }

      dispatch({ type: "setPreparing", value: true });
      dispatch({ type: "setError", value: null });

      try {
        const results = await Promise.all(uniqueUrls.map((url) => importMediaFromUrl(url)));

        const preparedEntries: Record<string, string> = {};
        const unresolved: string[] = [];
        const unresolvedMessages: string[] = [];

        for (const result of results) {
          if (result.ok) {
            preparedEntries[result.url] = result.mediaId;
          } else {
            unresolved.push(result.url);
            if (result.error) {
              unresolvedMessages.push(`${result.url}: ${result.error}`);
            }
          }
        }

        if (Object.keys(preparedEntries).length > 0) {
          dispatch({ type: "mergePreparedMedia", value: preparedEntries });
          toast.success(
            `Prepared ${Object.keys(preparedEntries).length} image${Object.keys(preparedEntries).length === 1 ? "" : "s"}.`,
          );
        }

        dispatch({ type: "setUnresolved", value: unresolved });

        if (unresolved.length > 0) {
          const firstError = unresolvedMessages[0];
          toast.error(
            firstError
              ? `Could not prepare ${unresolved.length} image URL${unresolved.length === 1 ? "" : "s"}. ${firstError}`
              : `Could not prepare ${unresolved.length} image URL${unresolved.length === 1 ? "" : "s"}.`,
          );
        }
      } finally {
        dispatch({ type: "setPreparing", value: false });
      }
    },
    [importMediaFromUrl],
  );

  const prepareAllImages = useCallback(() => {
    void prepareImageUrls(uniqueImages.map((image) => image.url));
  }, [prepareImageUrls, uniqueImages]);

  const prepareSingleImage = useCallback(
    (url: string) => {
      void prepareImageUrls([url]);
    },
    [prepareImageUrls],
  );

  const handleInsert = useCallback(() => {
    void (async () => {
      if (!state.markdown.trim()) {
        closeDrawer();
        return;
      }

      dispatch({ type: "setImporting", value: true });
      dispatch({ type: "setError", value: null });
      dispatch({ type: "setUnresolved", value: [] });

      try {
        // Import any images not yet prepared
        const mediaIdByUrl = new Map<string, string>();

        for (const [url, mediaId] of Object.entries(state.preparedMediaByUrl)) {
          if (typeof mediaId === "string" && mediaId.trim().length > 0) {
            mediaIdByUrl.set(url, mediaId);
          }
        }

        const missingUrls = uniqueImages
          .map((image) => image.url)
          .filter((url) => !mediaIdByUrl.has(url));

        const unresolved = new Set<string>();
        const newlyPrepared: Record<string, string> = {};

        if (missingUrls.length > 0) {
          const results = await Promise.all(missingUrls.map((url) => importMediaFromUrl(url)));

          for (const result of results) {
            if (result.ok) {
              mediaIdByUrl.set(result.url, result.mediaId);
              newlyPrepared[result.url] = result.mediaId;
            } else {
              unresolved.add(result.url);
            }
          }
        }

        if (Object.keys(newlyPrepared).length > 0) {
          dispatch({ type: "mergePreparedMedia", value: newlyPrepared });
        }

        // Delegate conversion to the server — Payload handles all feature transformers
        const response = await fetch(convertMarkdownEndpoint, {
          body: JSON.stringify({
            collectionSlug,
            fieldName,
            globalSlug,
            markdown: state.markdown,
            preparedMediaByUrl: Object.fromEntries(mediaIdByUrl),
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        const responsePayload = (await response.json().catch(() => ({}))) as {
          error?: string;
          lexicalState?: { root?: { children?: unknown[] } };
          ok?: boolean;
        };

        if (!response.ok || responsePayload.ok === false) {
          dispatch({
            type: "setError",
            value:
              typeof responsePayload.error === "string" && responsePayload.error.trim()
                ? responsePayload.error
                : `Conversion failed with status ${response.status}`,
          });
          return;
        }

        const serializedChildren = (responsePayload.lexicalState?.root?.children ??
          []) as SerializedLexicalNode[];

        editor.update(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection) && !$isNodeSelection(selection)) {
            $getRoot().selectEnd();
          }

          const nodes = serializedChildren.map((child) => $parseSerializedNode(child));

          if (nodes.length > 0) {
            $addUpdateTag(HISTORY_PUSH_TAG);
            $insertNodes(nodes);
          }
        });

        const unresolvedUrls = Array.from(unresolved);
        dispatch({ type: "setUnresolved", value: unresolvedUrls });

        if (serializedChildren.length > 0) {
          toast.success("Markdown imported.");
        }

        if (unresolvedUrls.length > 0) {
          toast.error(
            `Could not import ${unresolvedUrls.length} image URL${unresolvedUrls.length === 1 ? "" : "s"}. Original markdown was kept for those entries.`,
          );
        }

        closeDrawer();
      } catch (error) {
        dispatch({
          type: "setError",
          value: error instanceof Error ? error.message : "Failed to import markdown.",
        });
      } finally {
        dispatch({ type: "setImporting", value: false });
      }
    })();
  }, [
    closeDrawer,
    collectionSlug,
    convertMarkdownEndpoint,
    editor,
    fieldName,
    globalSlug,
    importMediaFromUrl,
    state.markdown,
    state.preparedMediaByUrl,
    uniqueImages,
  ]);

  return {
    error: state.error,
    handleCancel: closeDrawer,
    handleInsert,
    isImporting: state.isImporting,
    isPreparing: state.isPreparing,
    markdown: state.markdown,
    prepareAllImages,
    prepareSingleImage,
    preparedMediaByUrl: state.preparedMediaByUrl,
    setMarkdown,
    setPreparedMedia,
    uniqueImages,
    unresolvedImageUrls: state.unresolvedImageUrls,
  };
};
