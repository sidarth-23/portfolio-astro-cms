"use client";

import type { ReactElement } from "react";
import { useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  Button,
  Drawer,
  DrawerContentContainer,
  FieldDescription,
  FieldLabel,
  TextareaInput,
  UploadInput,
  fieldBaseClass,
  useConfig,
} from "@payloadcms/ui";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import { useDocumentInfo } from "@payloadcms/ui";

import { deriveAltFromUrl } from "./markdownImageUtils";
import {
  useMarkdownImportController,
  type MarkdownImportControllerValue,
} from "./useMarkdownImportController";

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
  const { fieldProps } = useEditorConfigContext();
  const { collectionSlug, globalSlug } = useDocumentInfo();

  const {
    config: { routes, serverURL },
  } = useConfig();

  // fieldProps.path is the dotted field path (e.g. "content" or "seo.description")
  // The server looks up by the leaf field name within flattenedFields
  const fieldName = fieldProps.path.split(".").pop() ?? fieldProps.path;

  const {
    error,
    handleCancel,
    handleInsert,
    isImporting,
    isPreparing,
    markdown,
    prepareAllImages,
    prepareSingleImage,
    preparedMediaByUrl,
    setMarkdown,
    setPreparedMedia,
    uniqueImages,
    unresolvedImageUrls,
  }: MarkdownImportControllerValue = useMarkdownImportController({
    collectionSlug,
    drawerSlug,
    editor,
    fieldName,
    globalSlug,
    initialMarkdown,
    onClose,
  });

  const imageRows = useMemo(() => {
    return uniqueImages.map((image, index) => {
      const preparedMediaId = preparedMediaByUrl[image.url] ?? null;

      return {
        image,
        index,
        preparedMediaId,
        title: image.alt?.trim() || deriveAltFromUrl(image.url),
      };
    });
  }, [preparedMediaByUrl, uniqueImages]);

  return (
    <Drawer slug={drawerSlug} title="Import Markdown">
      <DrawerContentContainer>
        <div className={fieldBaseClass}>
          <FieldLabel label="Markdown" path={`${drawerSlug}.markdown`} />
          <TextareaInput
            path={`${drawerSlug}.markdown`}
            placeholder="Paste markdown here..."
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
          />
          <FieldDescription
            description="Paste markdown and import directly into the active editor selection."
            path={`${drawerSlug}.markdown`}
          />
        </div>

        {imageRows.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "0.9rem",
              marginTop: "1.25rem",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: "0.75rem",
                justifyContent: "space-between",
                marginBottom: "0.35rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Image Imports
                </h3>
                <p
                  style={{
                    color: "var(--theme-elevation-700)",
                    fontSize: "0.86rem",
                    margin: "0.08rem 0 0",
                  }}
                >
                  Import image URLs into Media, then use native edit/remove actions on each row.
                </p>
              </div>

              <Button
                buttonStyle="primary"
                disabled={isImporting || isPreparing}
                margin={false}
                onClick={prepareAllImages}
                size="small"
                type="button"
              >
                {isPreparing ? "Preparing..." : "Prepare Images"}
              </Button>
            </div>

            {imageRows.map(({ image, index, preparedMediaId, title }) => {
              return (
                <div
                  key={image.url}
                  style={{
                    border: "1px solid var(--theme-elevation-150)",
                    borderRadius: "4px",
                    padding: "0.85rem 0.75rem",
                  }}
                >
                  <div
                    style={{
                      alignItems: "flex-start",
                      display: "flex",
                      gap: "0.75rem",
                      justifyContent: "space-between",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.98rem",
                          fontWeight: 600,
                          marginBottom: "0.08rem",
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          color: "var(--theme-elevation-700)",
                          fontSize: "0.82rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={image.url}
                      >
                        {image.url}
                      </div>
                    </div>

                    <div style={{ alignSelf: "center" }}>
                      <Button
                        buttonStyle="primary"
                        disabled={isImporting || isPreparing}
                        margin={false}
                        onClick={() => prepareSingleImage(image.url)}
                        size="small"
                        type="button"
                      >
                        {preparedMediaId ? "Re-prepare URL" : "Prepare URL"}
                      </Button>
                    </div>
                  </div>

                  <UploadInput
                    Description={null}
                    Label={null}
                    allowCreate={false}
                    api={routes.api}
                    path={`${drawerSlug}.images.${index}.media`}
                    relationTo="media"
                    serverURL={serverURL}
                    style={{ margin: 0 }}
                    value={preparedMediaId ?? undefined}
                    onChange={(value) => {
                      setPreparedMedia(image.url, value);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {unresolvedImageUrls.length > 0 && (
          <div className={fieldBaseClass}>
            <FieldDescription
              description={`Could not import ${unresolvedImageUrls.length} image URL${unresolvedImageUrls.length === 1 ? "" : "s"} in the previous attempt.`}
              path={`${drawerSlug}.images.unresolved`}
            />
          </div>
        )}

        {error && (
          <div className={fieldBaseClass}>
            <FieldDescription description={error} path={`${drawerSlug}.error`} />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            marginTop: "1rem",
          }}
        >
          <Button
            buttonStyle="secondary"
            disabled={isImporting || isPreparing}
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </Button>
          <Button
            buttonStyle="primary"
            disabled={isImporting || isPreparing}
            onClick={handleInsert}
            type="button"
          >
            {isImporting ? "Importing..." : "Import Into Editor"}
          </Button>
        </div>
      </DrawerContentContainer>
    </Drawer>
  );
}
