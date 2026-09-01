import { createCmsRestTransport } from "@sidshub/cms-core/client/transport";
import type { CmsTransport } from "@sidshub/cms-core/client";

const useMock =
  String(import.meta.env.ASTRO_MOCK_CMS ?? process.env.ASTRO_MOCK_CMS ?? "") === "true";
const siteUrl = typeof import.meta.env.SITE === "string" ? import.meta.env.SITE : undefined;

export async function createTransport(): Promise<CmsTransport> {
  if (useMock) {
    const { createMockTransport } = await import("./mock");
    return createMockTransport();
  }
  const { ASTRO_CMS_API_URL } = await import("astro:env/server");
  return createCmsRestTransport({
    apiUrl: ASTRO_CMS_API_URL,
    siteUrl,
  });
}
