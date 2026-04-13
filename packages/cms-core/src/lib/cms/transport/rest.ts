import { PayloadSDK } from "@payloadcms/sdk";
import type { Config } from "../../../payload-types";
import { createCmsClient } from "../domain";

type RestClientOptions = {
  apiUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
};

export const createCmsRestClient = ({ apiUrl, token, fetchImpl = fetch }: RestClientOptions) => {
  const apiBase = apiUrl.replace(/\/$/, "");
  const mediaBaseUrl = apiBase.replace(/\/api$/, "");

  const authedFetch: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(init instanceof Request ? init.headers : (init as RequestInit).headers);
    headers.set("Authorization", `Bearer ${token}`);
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

  return createCmsClient({ sdk, mediaBaseUrl });
};
