import type {
  ConvertMarkdownRequest,
  ConvertMarkdownResponse,
  ImportMediaFromUrlRequest,
  ImportMediaFromUrlResponse,
} from "../contracts";
import { getErrorMessage } from "../contracts";

export type ImportMediaApiResult =
  | {
      error?: undefined;
      mediaId: string;
      ok: true;
      url: string;
    }
  | {
      error: string;
      ok: false;
      url: string;
    };

export const importMediaByUrl = async ({
  endpoint,
  payload,
  url,
}: {
  endpoint: string;
  payload: ImportMediaFromUrlRequest;
  url: string;
}): Promise<ImportMediaApiResult> => {
  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const responsePayload = (await response.json().catch(() => ({}))) as ImportMediaFromUrlResponse;

    if (
      !response.ok ||
      responsePayload.ok === false ||
      responsePayload.mediaId === null ||
      responsePayload.mediaId === undefined
    ) {
      return {
        error: getErrorMessage(responsePayload, `Request failed with status ${response.status}`),
        ok: false,
        url,
      };
    }

    return {
      mediaId: String(responsePayload.mediaId),
      ok: true,
      url,
    };
  } catch {
    return { error: "Network request failed.", ok: false, url };
  }
};

export type ConvertMarkdownApiResult =
  | {
      error?: undefined;
      lexicalChildren: unknown[];
      ok: true;
    }
  | {
      error: string;
      ok: false;
    };

export const convertMarkdown = async ({
  endpoint,
  payload,
}: {
  endpoint: string;
  payload: ConvertMarkdownRequest;
}): Promise<ConvertMarkdownApiResult> => {
  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const responsePayload = (await response.json().catch(() => ({}))) as ConvertMarkdownResponse;

    if (!response.ok || responsePayload.ok === false) {
      return {
        error: getErrorMessage(responsePayload, `Conversion failed with status ${response.status}`),
        ok: false,
      };
    }

    return {
      lexicalChildren: responsePayload.lexicalState?.root?.children ?? [],
      ok: true,
    };
  } catch {
    return {
      error: "Network request failed.",
      ok: false,
    };
  }
};
