import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { Endpoint, FlattenedField, RichTextField } from "payload";

import { preprocessMarkdownForPayload } from "./markdownPreprocess";
import { replaceMarkdownImageUrlsWithMediaReferences } from "./markdown-paste/markdownImageUtils";

type ConvertMarkdownRequestBody = {
  collectionSlug?: unknown;
  fieldName?: unknown;
  globalSlug?: unknown;
  markdown?: unknown;
  preparedMediaByUrl?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readTrimmedString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const readPreparedMediaByUrl = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [k, v] of Object.entries(value)) {
    if (typeof k === "string" && typeof v === "string" && k.trim() && v.trim()) {
      result[k] = v;
    }
  }

  return result;
};

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

export const convertMarkdownEndpoint: Endpoint = {
  path: "/markdown-paste/convert",
  method: "post",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized", ok: false }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid request body", ok: false }, { status: 400 });
    }

    if (!isRecord(body)) {
      return Response.json({ error: "Invalid request body", ok: false }, { status: 400 });
    }

    const request = body as ConvertMarkdownRequestBody;
    const markdown = readTrimmedString(request.markdown);
    const fieldName = readTrimmedString(request.fieldName);
    const collectionSlug = readTrimmedString(request.collectionSlug);
    const globalSlug = readTrimmedString(request.globalSlug);
    const preparedMediaByUrl = readPreparedMediaByUrl(request.preparedMediaByUrl);

    if (!markdown) {
      return Response.json({ error: "markdown is required", ok: false }, { status: 400 });
    }

    if (!fieldName) {
      return Response.json({ error: "fieldName is required", ok: false }, { status: 400 });
    }

    if (!collectionSlug && !globalSlug) {
      return Response.json(
        { error: "collectionSlug or globalSlug is required", ok: false },
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
          { error: `Collection '${collectionSlug}' not found`, ok: false },
          { status: 400 },
        );
      }
      flattenedFields = collection.flattenedFields;
    } else {
      const global = payloadConfig.globals.find((g) => g.slug === globalSlug);
      if (!global) {
        return Response.json(
          { error: `Global '${globalSlug}' not found`, ok: false },
          { status: 400 },
        );
      }
      flattenedFields = global.flattenedFields;
    }

    const richTextField = findRichTextField(flattenedFields, fieldName);

    if (!richTextField) {
      const context = collectionSlug ? `collection '${collectionSlug}'` : `global '${globalSlug}'`;
      return Response.json(
        { error: `Rich text field '${fieldName}' not found in ${context}`, ok: false },
        { status: 400 },
      );
    }

    let editorConfig: ReturnType<typeof editorConfigFactory.fromField>;
    try {
      editorConfig = editorConfigFactory.fromField({ field: richTextField });
    } catch (err) {
      return Response.json(
        {
          error: err instanceof Error ? err.message : "Failed to resolve editor configuration",
          ok: false,
        },
        { status: 500 },
      );
    }

    // Replace prepared image URLs with media references (![media:ID]())
    const mediaIdByUrl = new Map<string, string>(Object.entries(preparedMediaByUrl));
    const { markdown: markdownWithMedia } = replaceMarkdownImageUrlsWithMediaReferences({
      markdown,
      mediaIdByUrl,
    });

    // Pre-process: detect consecutive standalone images → <imageGallery> JSX
    const preprocessedMarkdown = preprocessMarkdownForPayload(markdownWithMedia);

    // Delegate the full conversion to Payload — all feature transformers (blocks, uploads, etc.)
    let lexicalState: ReturnType<typeof convertMarkdownToLexical>;
    try {
      lexicalState = convertMarkdownToLexical({ editorConfig, markdown: preprocessedMarkdown });
    } catch (err) {
      return Response.json(
        {
          error: err instanceof Error ? err.message : "Markdown conversion failed",
          ok: false,
        },
        { status: 500 },
      );
    }

    return Response.json({ lexicalState, ok: true });
  },
};
