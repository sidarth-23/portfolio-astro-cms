import { cmsClient } from "@/lib/cms";

type ErrorPageSeo = {
  title: string;
  description: string;
  image?: string;
};

const FALLBACK_SEO: ErrorPageSeo = {
  title: "Something went wrong",
  description: "This page is unavailable right now.",
};

/**
 * Returns SEO metadata for error pages (404, 500, missing-content states).
 * Tries site settings first; falls back to hardcoded defaults if unavailable.
 * Never throws.
 */
export async function getErrorPageSeo(): Promise<ErrorPageSeo> {
  try {
    const siteSettings = await cmsClient.getSiteSettings();
    const { meta } = siteSettings;
    if (meta?.title && meta?.description) {
      return {
        title: meta.title,
        description: meta.description,
        image: cmsClient.mediaToUrl(meta.image) ?? undefined,
      };
    }
  } catch {
    // CMS unavailable — fall through to defaults
  }
  return FALLBACK_SEO;
}
