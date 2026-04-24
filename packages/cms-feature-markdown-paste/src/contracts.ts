export const MARKDOWN_PASTE_ERROR_CODE = {
  CONVERSION_FAILED: "CONVERSION_FAILED",
  FETCH_FAILED: "FETCH_FAILED",
  HOST_NOT_ALLOWED: "HOST_NOT_ALLOWED",
  IMAGE_TOO_LARGE: "IMAGE_TOO_LARGE",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_REQUEST_BODY: "INVALID_REQUEST_BODY",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  UNKNOWN: "UNKNOWN",
} as const;

export type MarkdownPasteErrorCode =
  (typeof MARKDOWN_PASTE_ERROR_CODE)[keyof typeof MARKDOWN_PASTE_ERROR_CODE];

export type MarkdownPasteError = {
  code: MarkdownPasteErrorCode;
  message: string;
};

export type MarkdownPasteErrorResponse = {
  error: MarkdownPasteError;
  ok: false;
};

export type ConvertMarkdownRequest = {
  collectionSlug?: string;
  fieldName: string;
  globalSlug?: string;
  markdown: string;
  preparedMediaByUrl?: Record<string, string>;
};

export type ConvertMarkdownSuccessResponse = {
  lexicalState: {
    root?: {
      children?: unknown[];
    };
  };
  ok: true;
};

export type ConvertMarkdownResponse = ConvertMarkdownSuccessResponse | MarkdownPasteErrorResponse;

export type ImportMediaFromUrlRequest = {
  alt: string;
  caption?: string;
  folder?: number | string;
  updateExistingMetadata?: boolean;
  url: string;
};

export type ImportMediaFromUrlSuccessResponse = {
  mediaId: string;
  ok: true;
  reused: boolean;
  sourceUrl: string;
};

export type ImportMediaFromUrlResponse =
  | ImportMediaFromUrlSuccessResponse
  | MarkdownPasteErrorResponse;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readTrimmedString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

export const normalizePreparedMediaByUrl = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [url, mediaId] of Object.entries(value)) {
    const normalizedUrl = readTrimmedString(url);
    const normalizedMediaId = readTrimmedString(mediaId);

    if (normalizedUrl && normalizedMediaId) {
      result[normalizedUrl] = normalizedMediaId;
    }
  }

  return result;
};

export const normalizeConvertMarkdownRequest = (value: unknown): ConvertMarkdownRequest | null => {
  if (!isRecord(value)) {
    return null;
  }

  const markdown = readTrimmedString(value.markdown);
  const fieldName = readTrimmedString(value.fieldName);
  const collectionSlug = readTrimmedString(value.collectionSlug);
  const globalSlug = readTrimmedString(value.globalSlug);

  return {
    ...(collectionSlug ? { collectionSlug } : {}),
    ...(globalSlug ? { globalSlug } : {}),
    fieldName,
    markdown,
    preparedMediaByUrl: normalizePreparedMediaByUrl(value.preparedMediaByUrl),
  };
};

export const normalizeImportMediaFromUrlRequest = (
  value: unknown,
): ImportMediaFromUrlRequest | null => {
  if (!isRecord(value)) {
    return null;
  }

  const alt = readTrimmedString(value.alt);
  const caption = readTrimmedString(value.caption);
  const url = readTrimmedString(value.url);

  let folder: number | string | undefined;
  if (typeof value.folder === "string") {
    folder = value.folder.trim();
  } else if (typeof value.folder === "number" && Number.isFinite(value.folder)) {
    folder = value.folder;
  }

  return {
    ...(caption ? { caption } : {}),
    ...(folder !== undefined ? { folder } : {}),
    ...(typeof value.updateExistingMetadata === "boolean"
      ? { updateExistingMetadata: value.updateExistingMetadata }
      : {}),
    alt,
    url,
  };
};

export const createErrorResponse = (
  code: MarkdownPasteErrorCode,
  message: string,
): MarkdownPasteErrorResponse => {
  return {
    error: {
      code,
      message,
    },
    ok: false,
  };
};

export const getErrorMessage = (response: unknown, fallback: string): string => {
  if (!isRecord(response)) {
    return fallback;
  }

  const error = response.error;

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (isRecord(error) && typeof error.message === "string") {
    const trimmed = error.message.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  return fallback;
};
