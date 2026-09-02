import { PayloadSDK } from "@payloadcms/sdk";
import type { Config } from "@sidshub/cms/payload-types";
import { PAYLOAD_API_KEY, PAYLOAD_PUBLIC_SERVER_URL } from "astro:env/server";

const baseURL = `${PAYLOAD_PUBLIC_SERVER_URL.replace(/\/+$/, "")}/api`;

export const cmsClient = new PayloadSDK<Config>({
  baseURL,
  baseInit: {
    headers: {
      Authorization: `users API-Key ${PAYLOAD_API_KEY}`,
    },
  },
});

export const cmsMediaBaseUrl = PAYLOAD_PUBLIC_SERVER_URL.replace(/\/+$/, "");
