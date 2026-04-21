"use client";

import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  Button,
  Drawer,
  FieldDescription,
  FieldLabel,
  fieldBaseClass,
  TextareaInput,
  useModal,
} from "@payloadcms/ui";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useEditorConfigContext, getEnabledNodes } from "@payloadcms/richtext-lexical/client";
import { createHeadlessEditor } from "@lexical/headless";
import type { SerializedEditorState } from "lexical";

type PreviewStatePluginProps = {
  previewState: SerializedEditorState;
};

function PreviewStatePlugin({ previewState }: PreviewStatePluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const nextState = editor.parseEditorState(previewState);
    editor.setEditorState(nextState);
  }, [editor, previewState]);

  return null;
}

type MarkdownImportSheetProps = {
  drawerSlug: string;
  initialMarkdown: string;
  onClose: () => void;
};

export function MarkdownImportSheet({
  drawerSlug,
  initialMarkdown,
  onClose,
}: MarkdownImportSheetProps): ReactElement {
  const [editor] = useLexicalComposerContext();
  const { editorConfig } = useEditorConfigContext();
  const { closeModal, modalState } = useModal();

  const isOpen = modalState[drawerSlug]?.isOpen ?? false;

  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [previewState, setPreviewState] = useState<SerializedEditorState | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMarkdown(initialMarkdown);
  }, [initialMarkdown, isOpen]);

  const configuredTransformers = useMemo(() => {
    const fromConfig = editorConfig.features.markdownTransformers ?? [];
    return fromConfig.length > 0 ? fromConfig : TRANSFORMERS;
  }, [editorConfig.features.markdownTransformers]);

  useEffect(() => {
    if (!isOpen) return;

    if (!markdown.trim()) {
      setPreviewState(null);
      setPreviewError(null);
      setIsRenderingPreview(false);
      return;
    }

    setIsRenderingPreview(true);
    setPreviewError(null);

    try {
      const previewEditor = createHeadlessEditor({
        nodes: getEnabledNodes({ editorConfig }),
      });

      previewEditor.update(
        () => {
          $convertFromMarkdownString(markdown, configuredTransformers);
        },
        { discrete: true },
      );

      const lexicalJSON = previewEditor.getEditorState().toJSON();
      setPreviewState(lexicalJSON);
    } catch (error) {
      setPreviewState(null);
      setPreviewError(error instanceof Error ? error.message : "Failed to render preview.");
    } finally {
      setIsRenderingPreview(false);
    }
  }, [configuredTransformers, editorConfig, isOpen, markdown]);

  const handleInsert = useCallback(() => {
    if (!markdown.trim()) {
      closeModal(drawerSlug);
      onClose();
      return;
    }

    editor.update(() => {
      $convertFromMarkdownString(markdown, configuredTransformers);
    });

    closeModal(drawerSlug);
    onClose();
  }, [closeModal, configuredTransformers, drawerSlug, editor, markdown, onClose]);

  const handleCancel = useCallback(() => {
    closeModal(drawerSlug);
    onClose();
  }, [closeModal, drawerSlug, onClose]);

  const previewEditorConfig = useMemo<InitialConfigType>(
    () => ({
      editable: false,
      editorState: null,
      namespace: `${drawerSlug}-preview-editor`,
      nodes: getEnabledNodes({ editorConfig }),
      onError: (error) => {
        throw error;
      },
      theme: editorConfig.lexical?.theme,
    }),
    [drawerSlug, editorConfig],
  );

  return (
    <Drawer slug={drawerSlug} title="Import Markdown">
      <div style={{ display: "grid", gap: "1rem" }}>
        <div className={fieldBaseClass}>
          <FieldLabel label="Markdown Source" path={`${drawerSlug}.markdown`} />
          <TextareaInput
            path={`${drawerSlug}.markdown`}
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="Paste markdown here..."
          />
          <FieldDescription
            description="Paste markdown content and review the converted preview before inserting."
            path={`${drawerSlug}.markdown`}
          />
        </div>

        <div className={fieldBaseClass}>
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Preview (read-only)</div>
          <div
            style={{
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "4px",
              minHeight: "10rem",
              overflowX: "auto",
            }}
          >
            {previewError ? (
              <p style={{ color: "var(--theme-error-500)", padding: "0.75rem 1.25rem" }}>
                {previewError}
              </p>
            ) : isRenderingPreview ? (
              <p style={{ padding: "0.75rem 1.25rem" }}>Rendering preview...</p>
            ) : previewState ? (
              <div style={{ padding: "0.75rem 1.25rem" }}>
                <LexicalComposer initialConfig={previewEditorConfig}>
                  <PreviewStatePlugin previewState={previewState} />
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        aria-readonly="true"
                        style={{
                          minHeight: "8rem",
                          outline: "none",
                        }}
                      />
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                    placeholder={null}
                  />
                </LexicalComposer>
              </div>
            ) : (
              <p style={{ color: "var(--theme-elevation-600)", padding: "0.75rem 1.25rem" }}>
                Nothing to preview yet.
              </p>
            )}
          </div>
          <FieldDescription
            description="Preview is read-only and mirrors how markdown will be imported."
            path={`${drawerSlug}.preview`}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <Button buttonStyle="secondary" onClick={handleCancel} size="small" type="button">
            Cancel
          </Button>
          <Button buttonStyle="primary" onClick={handleInsert} size="small" type="button">
            Insert Into Editor
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
