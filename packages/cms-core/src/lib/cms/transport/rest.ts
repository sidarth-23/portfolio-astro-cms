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

  const authedFetch: typeof fetch = (input, init = {}) => {
    const headers = new Headers(init instanceof Request ? init.headers : (init as RequestInit).headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init instanceof Request) {
      return fetchImpl(new Request(input, { ...init, headers }));
    }
    return fetchImpl(input, { ...(init as RequestInit), headers });
  };

  const sdk = new PayloadSDK<Config>({ baseURL: apiBase, fetch: authedFetch });

  return createCmsClient({ sdk, mediaBaseUrl });
};
