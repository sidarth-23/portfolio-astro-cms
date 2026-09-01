import type { Payload } from "payload";

import type { SidebarIconDiagnostic } from "../../types";
import { parseIconValue, isValidIconValue } from "@sidshub/icon-catalog";

// ---- Types ----

export type SidebarIconEntry = {
  index: number;
  iconValue: string;
};

// ---- Profile image ----

type MediaLike = { url?: string | null };

export async function fetchProfileImageDataUri(payload: Payload): Promise<string | undefined> {
  try {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      depth: 1,
    });

    const profileImage = (siteSettings as unknown as Record<string, unknown>).profileImage as
      | MediaLike
      | number
      | null
      | undefined;

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

// ---- Sidebar icons ----

export async function fetchSidebarIcons(payload: Payload): Promise<SidebarIconEntry[]> {
  try {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
    });

    const items =
      ((siteSettings as unknown as Record<string, unknown>).sidebarFooterItems as Array<{
        icon?: string;
      }>) ?? [];

    return items
      .map((item, index) => ({ index, iconValue: item.icon ?? "" }))
      .filter((item) => item.iconValue.length > 0);
  } catch {
    return [];
  }
}

export function getSidebarIconDiagnostics(entries: SidebarIconEntry[]): SidebarIconDiagnostic[] {
  const diagnostics: SidebarIconDiagnostic[] = [];

  for (const entry of entries) {
    const parsed = parseIconValue(entry.iconValue);
    if (!parsed) {
      diagnostics.push({
        index: entry.index,
        iconValue: entry.iconValue,
        reason: "invalid-format",
        message: `Icon must use a recognised prefix format (e.g. "si:<slug>" or "ph:<name>").`,
      });
      continue;
    }

    if (!isValidIconValue(entry.iconValue)) {
      diagnostics.push({
        index: entry.index,
        iconValue: entry.iconValue,
        reason: "unknown-icon",
        message: `Unknown icon "${entry.iconValue}".`,
      });
    }
  }

  return diagnostics;
}
