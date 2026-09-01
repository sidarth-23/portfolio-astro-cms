import type { Payload } from "payload";
import type { CmsQueryOperations } from "./queries";
import { getCmsPayload } from "./payload";

const siteUrl = typeof import.meta.env.SITE === "string" ? import.meta.env.SITE : undefined;

export type CmsContext = {
  query: CmsQueryOperations;
  mediaBaseUrl: string;
  siteUrl?: string;
};

export async function createTransport(): Promise<CmsContext> {
  const payload: Payload = await getCmsPayload();
  return {
    query: payload,
    mediaBaseUrl: payload.config.serverURL ?? "",
    siteUrl,
  };
}
