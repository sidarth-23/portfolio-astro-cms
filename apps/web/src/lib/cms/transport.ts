import type { Payload } from "payload";
import type { CmsQueryOperations } from "./queries";

const useMock =
  String(import.meta.env.ASTRO_MOCK_CMS ?? process.env.ASTRO_MOCK_CMS ?? "") === "true";
const siteUrl = typeof import.meta.env.SITE === "string" ? import.meta.env.SITE : undefined;

export type CmsContext = {
  query: CmsQueryOperations;
  mediaBaseUrl: string;
  siteUrl?: string;
};

export async function createTransport(): Promise<CmsContext> {
  if (useMock) {
    const { createMockTransport } = await import("./mock");
    return { query: createMockTransport(), mediaBaseUrl: "http://mock", siteUrl: "http://mock" };
  }

  const { getCmsPayload } = await import("./payload");
  const payload: Payload = await getCmsPayload();
  return {
    query: payload,
    mediaBaseUrl: payload.config.serverURL ?? "",
    siteUrl,
  };
}
