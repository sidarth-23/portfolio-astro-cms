import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { Endpoint, FlattenedField, RichTextField } from "payload";

import {
  createErrorResponse,
  MARKDOWN_PASTE_ERROR_CODE,
  normalizeConvertMarkdownRequest,
} from "../contracts";
import { preprocessMarkdownForPayload } from "../preprocessor";
import { replaceMarkdownImageUrlsWithMediaReferences } from "../plugins/markdownImageUtils";

const findRichTextField = (
  flattenedFields: FlattenedField[],
  fieldName: string,
): RichTextField | null => {
  for (const field of flattenedFields) {
    if (field.type === "richText" && "name" in field && field.name === fieldName) {
      return field;
    }
  }

  return null;
};

export const createConvertMarkdownEndpoint = (): Endpoint => {
  return {
    path: "/markdown-paste/convert",
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

      const request = normalizeConvertMarkdownRequest(body);

      if (!request) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.INVALID_REQUEST_BODY,
            "Invalid request body",
          ),
          { status: 400 },
        );
      }

      const { collectionSlug, fieldName, globalSlug, markdown, preparedMediaByUrl } = request;

      if (!markdown) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.MISSING_REQUIRED_FIELD,
            "markdown is required",
          ),
          { status: 400 },
        );
      }

      if (!fieldName) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.MISSING_REQUIRED_FIELD,
            "fieldName is required",
          ),
          { status: 400 },
        );
      }

      if (!collectionSlug && !globalSlug) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.MISSING_REQUIRED_FIELD,
            "collectionSlug or globalSlug is required",
          ),
          { status: 400 },
        );
      }

      // Resolve the sanitized Payload config entry to get flattenedFields
      const payloadConfig = req.payload.config;

      let flattenedFields: FlattenedField[] | null = null;

      if (collectionSlug) {
        const collection = payloadConfig.collections.find((c) => c.slug === collectionSlug);
        if (!collection) {
          return Response.json(
            createErrorResponse(
              MARKDOWN_PASTE_ERROR_CODE.NOT_FOUND,
              `Collection '${collectionSlug}' not found`,
            ),
            { status: 400 },
          );
        }
        flattenedFields = collection.flattenedFields;
      } else {
        const global = payloadConfig.globals.find((g) => g.slug === globalSlug);
        if (!global) {
          return Response.json(
            createErrorResponse(
              MARKDOWN_PASTE_ERROR_CODE.NOT_FOUND,
              `Global '${globalSlug}' not found`,
            ),
            { status: 400 },
          );
        }
        flattenedFields = global.flattenedFields;
      }

      const richTextField = findRichTextField(flattenedFields, fieldName);

      if (!richTextField) {
        const context = collectionSlug
          ? `collection '${collectionSlug}'`
          : `global '${globalSlug}'`;
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.NOT_FOUND,
            `Rich text field '${fieldName}' not found in ${context}`,
          ),
          { status: 400 },
        );
      }

      let editorConfig: ReturnType<typeof editorConfigFactory.fromField>;
      try {
        editorConfig = editorConfigFactory.fromField({ field: richTextField });
      } catch (err) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.UNKNOWN,
            err instanceof Error ? err.message : "Failed to resolve editor configuration",
          ),
          { status: 500 },
        );
      }

      // Replace prepared image URLs with media references (![media:ID]())
      const mediaIdByUrl = new Map<string, string>(Object.entries(preparedMediaByUrl ?? {}));
      const { markdown: markdownWithMedia } = replaceMarkdownImageUrlsWithMediaReferences({
        markdown,
        mediaIdByUrl,
      });

      // Pre-process: detect consecutive standalone images -> <imageGallery> JSX
      const preprocessedMarkdown = preprocessMarkdownForPayload(markdownWithMedia);

      // Delegate the full conversion to Payload; all feature transformers (blocks, uploads, etc.) run here.
      let lexicalState: ReturnType<typeof convertMarkdownToLexical>;
      try {
        lexicalState = convertMarkdownToLexical({ editorConfig, markdown: preprocessedMarkdown });
      } catch (err) {
        return Response.json(
          createErrorResponse(
            MARKDOWN_PASTE_ERROR_CODE.CONVERSION_FAILED,
            err instanceof Error ? err.message : "Markdown conversion failed",
          ),
          { status: 500 },
        );
      }

      return Response.json({ lexicalState, ok: true });
    },
  };
};

export const convertMarkdownEndpoint: Endpoint = createConvertMarkdownEndpoint();
