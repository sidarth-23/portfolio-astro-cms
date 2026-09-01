import { PayloadSDK } from "@payloadcms/sdk";
import type { Config } from "@/payload-types";

export type CmsTransport = {
  sdk: PayloadSDK<Config>;
  mediaBaseUrl: string;
  siteUrl?: string;
};

type RestClientOptions = {
  apiUrl: string;
  token?: string;
  siteUrl?: string;
  fetchImpl?: typeof fetch;
};

export const createCmsRestTransport = ({
  apiUrl,
  token,
  siteUrl,
  fetchImpl = fetch,
}: RestClientOptions): CmsTransport => {
  const apiBase = apiUrl.replace(/\/$/, "");
  const mediaBaseUrl = apiBase.replace(/\/api$/, "");

  const authedFetch: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(
      init instanceof Request ? init.headers : (init as RequestInit).headers,
    );
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    try {
      if (init instanceof Request) {
        return await fetchImpl(new Request(input, { ...init, headers }));
      }
      return await fetchImpl(input, { ...(init as RequestInit), headers });
    } catch (err) {
      if (err instanceof TypeError) {
        const msg = err.message ?? "";
        if (
          msg.includes("fetch failed") ||
          msg.includes("ECONNREFUSED") ||
          msg.includes("ENOTFOUND") ||
          msg.includes("ECONNRESET")
        ) {
          throw new Error(
            `CMS is unavailable at ${apiBase}. Ensure the CMS server is running and reachable.\n  Cause: ${msg}`,
          );
        }
      }
      throw err;
    }
  };

  const sdk = new PayloadSDK<Config>({ baseURL: apiBase, fetch: authedFetch });

  return { sdk, mediaBaseUrl, siteUrl };
};
