import config from "@sidshub/cms/payload-config";
import { getPayload, type Payload } from "payload";

let cachedPayload: Promise<Payload> | null = null;

/** Load the CMS configuration for server-side queries. */
export function getCmsPayload(): Promise<Payload> {
  if (!cachedPayload) {
    cachedPayload = getPayload({ config }).catch((error: unknown) => {
      cachedPayload = null;
      throw error;
    });
  }

  return cachedPayload;
}
