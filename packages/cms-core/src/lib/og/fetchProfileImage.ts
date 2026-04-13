import type { Payload } from "payload";
import type { Media } from "../../payload-types";

export async function fetchProfileImageDataUri(payload: Payload): Promise<string | undefined> {
  try {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      depth: 1,
    });

    const profileImage = siteSettings.profileImage as Media | number | null | undefined;

    if (!profileImage || typeof profileImage === "number") return undefined;

    const imageUrl = profileImage.url;
    if (!imageUrl) return undefined;

    const response = await fetch(imageUrl);
    if (!response.ok) return undefined;

    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") ?? "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");

    return `data:${mimeType};base64,${base64}`;
  } catch {
    return undefined;
  }
}

export async function fetchSidebarIcons(payload: Payload): Promise<string[]> {
  try {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
    });

    const items = siteSettings.sidebarFooterItems ?? [];
    return items.map((item) => item.icon ?? "").filter(Boolean);
  } catch {
    return [];
  }
}
