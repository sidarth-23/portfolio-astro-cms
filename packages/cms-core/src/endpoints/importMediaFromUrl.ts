import path from "node:path";
import type { Endpoint } from "payload";

import { mediaPasteUrlAllowList } from "@/collections/Media";
import type { Media } from "@/payload-types";

const IMAGE_IMPORT_TIMEOUT_MS = 10_000;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type ImportMediaRequestBody = {
  alt?: unknown;
  caption?: unknown;
  folder?: unknown;
  updateExistingMetadata?: unknown;
  url?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readTrimmedString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const readFolderValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
};

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

const isUrlAllowed = (rawUrl: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.replace(":", "").toLowerCase();

  return mediaPasteUrlAllowList.some((rule) => {
    const ruleHostname = rule.hostname.toLowerCase();
    const ruleProtocol = (rule.protocol ?? "https").toLowerCase();
    const hostMatches = hostname === ruleHostname || hostname.endsWith(`.${ruleHostname}`);
    return hostMatches && protocol === ruleProtocol;
  });
};

const getExtensionForMime = (mimeType: string): string => {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "image/jpeg";
  return EXTENSION_BY_MIME[normalized] ?? "jpg";
};

const getSafeFileStem = (rawUrl: string): string => {
  try {
    const pathname = new URL(rawUrl).pathname;
    const basename = path.basename(pathname, path.extname(pathname));
    const normalized = basename
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 64);
    return normalized.length > 0 ? normalized : "imported-image";
  } catch {
    return "imported-image";
  }
};

type MediaCaption = NonNullable<Media["caption"]>;

const createLexicalPlainText = (text: string): MediaCaption | undefined => {
  const value = text.trim();
  if (!value) return undefined;

  return {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: value,
              version: 1,
            },
          ],
          direction: null,
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };
};

export const importMediaFromUrlEndpoint: Endpoint = {
  path: "/media-import-url",
  method: "post",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!isRecord(body)) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const request = body as ImportMediaRequestBody;
    const url = readTrimmedString(request.url);
    const alt = readTrimmedString(request.alt);
    const caption = readTrimmedString(request.caption);
    const folder = readFolderValue(request.folder);
    const updateExistingMetadata =
      typeof request.updateExistingMetadata === "boolean" ? request.updateExistingMetadata : true;

    if (!url) {
      return Response.json({ error: "Image URL is required" }, { status: 400 });
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return Response.json({ error: "Image URL must use http or https" }, { status: 400 });
      }
    } catch {
      return Response.json({ error: "Image URL is invalid" }, { status: 400 });
    }

    if (!alt) {
      return Response.json({ error: "Image alt text is required" }, { status: 400 });
    }

    if (!isUrlAllowed(url)) {
      return Response.json({ error: "Image URL host is not allowed" }, { status: 403 });
    }

    try {
      const existing = await req.payload.find({
        collection: "media",
        where: { sourceUrl: { equals: url } },
        depth: 0,
        limit: 1,
      });

      const existingDoc = existing.docs[0];
      if (existingDoc) {
        if (updateExistingMetadata) {
          const updateData: Record<string, unknown> = { alt };
          const captionValue = createLexicalPlainText(caption);

          if (captionValue) {
            updateData.caption = captionValue;
          }

          if (folder) {
            updateData.folder = folder;
          }

          await req.payload.update({
            collection: "media",
            id: existingDoc.id,
            data: updateData,
          });
        }

        return Response.json({ mediaId: existingDoc.id, reused: true, sourceUrl: url });
      }

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), IMAGE_IMPORT_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutHandle);
      }

      if (!response.ok) {
        return Response.json(
          { error: `Failed to fetch image (${response.status})` },
          { status: 400 },
        );
      }

      const mimeType =
        response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
      if (!mimeType.startsWith("image/")) {
        return Response.json({ error: "URL does not point to an image" }, { status: 400 });
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        return Response.json({ error: "Image response is empty" }, { status: 400 });
      }

      if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
        return Response.json({ error: "Image exceeds 5MB limit" }, { status: 413 });
      }

      const extension = getExtensionForMime(mimeType);
      const fileStem = getSafeFileStem(url);
      const name = `${fileStem}.${extension}`;
      const altText = alt || fileStem.replace(/[-_]+/g, " ").trim() || "Imported image";
      const captionValue = createLexicalPlainText(caption);

      const created = await req.payload.create({
        collection: "media",
        data: {
          alt: altText,
          ...(captionValue ? { caption: captionValue } : {}),
          ...(folder ? { folder } : {}),
          sourceUrl: url,
        },
        file: {
          data: Buffer.from(arrayBuffer),
          mimetype: mimeType,
          name,
          size: arrayBuffer.byteLength,
        },
      });

      return Response.json({ mediaId: created.id, reused: false, sourceUrl: url });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ error: message }, { status: 500 });
    }
  },
};
