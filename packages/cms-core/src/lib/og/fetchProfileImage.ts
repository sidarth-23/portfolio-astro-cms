import type { Payload } from "payload";
import type { Media } from "../../payload-types";
import { isPhosphorIconName, isSimpleIconSlug, parseIconValueStrict } from "../icons";

export type SidebarIconEntry = {
  index: number;
  iconValue: string;
};

export type SidebarIconDiagnostic = {
  index: number;
  iconValue: string;
  reason: "invalid-format" | "unknown-simple-icon" | "unknown-phosphor-icon";
  message: string;
};

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

export async function fetchSidebarIcons(payload: Payload): Promise<SidebarIconEntry[]> {
  try {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
    });

    const items = siteSettings.sidebarFooterItems ?? [];
    return items
      .map((item, index) => ({ index, iconValue: item.icon ?? "" }))
      .filter((item) => item.iconValue.length > 0);
  } catch {
    return [];
  }
}

export const getSidebarIconDiagnostics = (entries: SidebarIconEntry[]): SidebarIconDiagnostic[] => {
  const diagnostics: SidebarIconDiagnostic[] = [];

  for (const entry of entries) {
    const parsed = parseIconValueStrict(entry.iconValue);
    if (!parsed) {
      diagnostics.push({
        index: entry.index,
        iconValue: entry.iconValue,
        reason: "invalid-format",
        message: `Icon must use canonical format ("si:<slug>" or "ph:<name>").`,
      });
      continue;
    }

    if (parsed.source === "simple-icons" && !isSimpleIconSlug(parsed.slug)) {
      diagnostics.push({
        index: entry.index,
        iconValue: entry.iconValue,
        reason: "unknown-simple-icon",
        message: `Unknown Simple Icons slug "${parsed.slug}".`,
      });
      continue;
    }

    if (parsed.source === "phosphor" && !isPhosphorIconName(parsed.name)) {
      diagnostics.push({
        index: entry.index,
        iconValue: entry.iconValue,
        reason: "unknown-phosphor-icon",
        message: `Unknown Phosphor icon name "${parsed.name}".`,
      });
    }
  }

  return diagnostics;
};
