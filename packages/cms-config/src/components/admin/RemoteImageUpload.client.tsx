"use client";

import { type ChangeEvent, useState } from "react";

import { Button, Drawer, DrawerToggler, TextInput, Upload, useDocumentInfo } from "@payloadcms/ui";

type ImportResponse = {
  doc?: {
    id?: number | string;
  };
  message?: string;
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const json = (await response.json()) as ImportResponse;
    if (typeof json.message === "string" && json.message.trim().length) {
      return json.message;
    }
  } catch {
    return "Remote image import failed.";
  }

  return "Remote image import failed.";
};

export function RemoteImageUploadClient() {
  const { collectionSlug, docConfig, initialState } = useDocumentInfo();
  const [isImporting, setIsImporting] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const drawerSlug = "remote-image-import";

  const uploadConfig = docConfig && "upload" in docConfig ? docConfig.upload : undefined;

  if (!collectionSlug || !uploadConfig) {
    return null;
  }

  const handleImport = async (): Promise<void> => {
    if (!remoteUrl.trim().length) {
      setErrorMessage("A public image URL is required.");
      return;
    }

    if (!altText.trim().length) {
      setErrorMessage("Alt text is required.");
      return;
    }

    setErrorMessage(null);
    setIsImporting(true);

    try {
      const response = await fetch("/api/media/import-url", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alt: altText.trim(),
          url: remoteUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        setErrorMessage(errorMessage);
        return;
      }

      const json = (await response.json()) as ImportResponse;
      const createdId = json.doc?.id;

      if (createdId) {
        window.location.assign(`/collections/media/${createdId}`);
        return;
      }

      window.location.reload();
    } catch {
      setErrorMessage("Remote image import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Drawer slug={drawerSlug}>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: "32rem", padding: "0.5rem 0" }}>
          <h3 style={{ margin: 0 }}>Import Remote Image</h3>
          <p style={{ margin: 0 }}>
            Images are fetched server-side. Only public <code>http/https</code> image URLs are accepted.
          </p>

          <TextInput
            label="Remote Image URL"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setRemoteUrl(event.target.value)}
            path="remoteImport.url"
            placeholder="https://example.com/image.jpg"
            value={remoteUrl}
          />

          <TextInput
            label="Alt Text"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setAltText(event.target.value)}
            path="remoteImport.alt"
            placeholder="Describe the image"
            value={altText}
          />

          {errorMessage ? (
            <p aria-live="polite" style={{ color: "var(--theme-error-500)", margin: 0 }}>
              {errorMessage}
            </p>
          ) : null}

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <Button
              buttonStyle="secondary"
              onClick={() => {
                setRemoteUrl("");
                setAltText("");
                setErrorMessage(null);
              }}
              type="button"
            >
              Clear
            </Button>
            <Button buttonStyle="primary" disabled={isImporting} onClick={handleImport} type="button">
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </Drawer>

      <Upload
        collectionSlug={collectionSlug}
        customActions={[
          <DrawerToggler key="import-remote-image" slug={drawerSlug}>
            <Button
              buttonStyle="secondary"
              onClick={() => {
                setErrorMessage(null);
              }}
              type="button"
            >
              Import from URL
            </Button>
          </DrawerToggler>,
        ]}
        initialState={initialState}
        uploadConfig={uploadConfig}
      />
    </>
  );
}
