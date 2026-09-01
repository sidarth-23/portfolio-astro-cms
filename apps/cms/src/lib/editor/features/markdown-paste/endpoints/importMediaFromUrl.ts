import path from "node:path";
import type { Endpoint } from "payload";

import {
  createErrorResponse,
  MARKDOWN_PASTE_ERROR_CODE,
  normalizeImportMediaFromUrlRequest,
} from "../contracts";
import {
  resolveAllowedImageHosts,
  resolveMediaCollectionSlug,
  type MarkdownPastePluginOptions,
} from "../options";

type LexicalNode = {
  [key: string]: unknown;
  type: string;
  version: number;
};

type Media = {
  caption?: {
    root: {
      children: LexicalNode[];
      direction: "ltr" | "rtl" | null;
      format: "" | "center" | "left" | "right" | "end" | "start" | "justify";
      type: string;
      version: number;
      indent: number;
    };
  };
};

const IMAGE_IMPORT_TIMEOUT_MS = 10_000;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

const isUrlAllowed = (
  rawUrl: string,
  allowList: ReturnType<typeof resolveAllowedImageHosts>,
): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.replace(":", "").toLowerCase();

  return allowList.some((rule) => {
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

const createLexicalPlainText = (text: string): Media["caption"] | undefined => {
  const value = text.trim();
  if (!value) return undefined;

  const lexicalValue: NonNullable<Media["caption"]> = {
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

  return lexicalValue;
};

export const createImportMediaFromUrlEndpoint = (
  options?: Pick<
    MarkdownPastePluginOptions,
    "allowedImageHosts" | "allowedImageHostsMode" | "mediaCollectionSlug"
  >,
): Endpoint => {
  const mediaCollectionSlug = resolveMediaCollectionSlug(options);
  const allowList = resolveAllowedImageHosts(options);

  return {
    path: "/markdown-paste/import-media",
    method: "post",
    handler: async (req) => {
      if (!req.user) {
        return Response.json(
          createErrorResponse(MARKDOWN_PASTE_ERROR_CODE.UNAUTHORIZED, "Unauthorized"),
          { status: 401 },
        );
      }

      let body: unknown;
      try {
        body = await req.json?.();
      } catch {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.INVALID_REQUEST_BODY,
            "Invalid request body",
          ),
          { status: 400 },
        );
      }

      const request = normalizeImportMediaFromUrlRequest(body);

      if (!request) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.INVALID_REQUEST_BODY,
            "Invalid request body",
          ),
          { status: 400 },
        );
      }

      const { alt, caption, updateExistingMetadata = false, url } = request;
      const captionText = caption ?? "";
      const folder = request.folder !== undefined ? String(request.folder).trim() : "";

      if (!url) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.MISSING_REQUIRED_FIELD,
            "Image URL is required",
          ),
          { status: 400 },
        );
      }

      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return Response.json(
            createErrorResponse(
              MARKDOWN_PASTE_ERROR_CODE.INVALID_INPUT,
              "Image URL must use http or https",
            ),
            { status: 400 },
          );
        }
      } catch {
        return Response.json(
          createErrorResponse(MARKDOWN_PASTE_ERROR_CODE.INVALID_INPUT, "Image URL is invalid"),
          { status: 400 },
        );
      }

      if (!alt) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.MISSING_REQUIRED_FIELD,
            "Image alt text is required",
          ),
          { status: 400 },
        );
      }

      if (!isUrlAllowed(url, allowList)) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.HOST_NOT_ALLOWED,
            "Image URL host is not allowed",
          ),
          { status: 403 },
        );
      }

      try {
        const existing = await req.payload.find({
          collection: mediaCollectionSlug as "media",
          where: { sourceUrl: { equals: url } },
          depth: 0,
          limit: 1,
        });

        const existingDoc = existing.docs[0];
        if (existingDoc) {
          if (updateExistingMetadata) {
            const updateData: Record<string, unknown> = { alt };
            const captionValue = createLexicalPlainText(captionText);
            updateData.caption = captionValue ?? null;
            updateData.folder = folder || null;

            await req.payload.update({
              collection: mediaCollectionSlug as "media",
              id: existingDoc.id,
              data: updateData,
            });
          }

          return Response.json({
            mediaId: String(existingDoc.id),
            ok: true,
            reused: true,
            sourceUrl: url,
          });
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
            createErrorResponse(
              MARKDOWN_PASTE_ERROR_CODE.FETCH_FAILED,
              `Failed to fetch image (${response.status})`,
            ),
            { status: 400 },
          );
        }

        const mimeType =
          response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
        if (!mimeType.startsWith("image/")) {
          return Response.json(
            createErrorResponse(
              MARKDOWN_PASTE_ERROR_CODE.INVALID_INPUT,
              "URL does not point to an image",
            ),
            { status: 400 },
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          return Response.json(
            createErrorResponse(MARKDOWN_PASTE_ERROR_CODE.INVALID_INPUT, "Image response is empty"),
            { status: 400 },
          );
        }

        if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
          return Response.json(
            createErrorResponse(
              MARKDOWN_PASTE_ERROR_CODE.IMAGE_TOO_LARGE,
              "Image exceeds 5MB limit",
            ),
            { status: 413 },
          );
        }

        const extension = getExtensionForMime(mimeType);
        const fileStem = getSafeFileStem(url);
        const name = `${fileStem}.${extension}`;
        const altText = alt || fileStem.replace(/[-_]+/g, " ").trim() || "Imported image";
        const captionValue = createLexicalPlainText(captionText);

        const created = await req.payload.create({
          collection: mediaCollectionSlug as "media",
          data: {
            alt: altText,
            ...(captionValue ? { caption: captionValue } : { caption: null }),
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

        return Response.json({
          mediaId: String(created.id),
          ok: true,
          reused: false,
          sourceUrl: url,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json(createErrorResponse(MARKDOWN_PASTE_ERROR_CODE.UNKNOWN, message), {
          status: 500,
        });
      }
    },
  };
};

export const importMediaFromUrlEndpoint: Endpoint = createImportMediaFromUrlEndpoint();
