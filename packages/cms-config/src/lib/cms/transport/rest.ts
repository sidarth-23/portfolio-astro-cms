import { createCmsClient } from "../domain";
import type { Params } from "../domain";

type RestClientOptions = {
  apiUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
};

const responseSnippet = (value: string): string => {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
};

const buildUrl = (apiBase: string, path: string, params?: Params): string => {
  const url = new URL(`${apiBase}${path.startsWith("/") ? path : `/${path}`}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export const createCmsRestClient = ({ apiUrl, token, fetchImpl = fetch }: RestClientOptions) => {
  const apiBase = apiUrl.replace(/\/$/, "");
  const mediaBaseUrl = apiBase.replace(/\/api$/, "");

  const payloadFetch = async <T>(path: string, params?: Params): Promise<T> => {
    const url = buildUrl(apiBase, path, params);
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    let response: Response;

    try {
      response = await fetchImpl(url, { headers });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Payload fetch failed for ${path} (${url}): network error: ${reason}`);
    }

    const rawBody = await response.text();
    const snippet = rawBody ? responseSnippet(rawBody) : "";

    if (!response.ok) {
      const details = snippet ? ` Response: ${snippet}` : "";
      throw new Error(
        `Payload fetch failed for ${path} (${url}) with status ${response.status} ${response.statusText}.${details}`,
      );
    }

    if (!rawBody) {
      throw new Error(
        `Payload fetch failed for ${path} (${url}) with status ${response.status} ${response.statusText}: empty response body.`,
      );
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const details = snippet ? ` Response: ${snippet}` : "";
      throw new Error(`Payload fetch failed for ${path} (${url}): invalid JSON response (${reason}).${details}`);
    }
  };

  return createCmsClient({
    fetch: payloadFetch,
    mediaBaseUrl,
  });
};
