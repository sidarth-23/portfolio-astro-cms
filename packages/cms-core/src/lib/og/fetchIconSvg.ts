import * as simpleIcons from "simple-icons";

import { getPhosphorIconSvgUrl, isPhosphorIconName, isSimpleIconSlug, parseIconValueStrict } from "../icons";

type SimpleIconEntry = {
  slug: string;
  svg: string;
};

const SIMPLE_ICONS_BY_SLUG = new Map(
  Object.values(simpleIcons)
    .filter((icon) => {
      return typeof icon === "object" && icon !== null && "slug" in icon && "svg" in icon;
    })
    .map((icon) => {
      const entry = icon as SimpleIconEntry;
      return [entry.slug, entry.svg] as const;
    }),
);

export type IconFetchFailureReason =
  | "invalid-format"
  | "unknown-simple-icon"
  | "unknown-phosphor-icon"
  | "missing-phosphor-asset"
  | "read-failed";

export type IconFetchResult =
  | {
      ok: true;
      svg: string;
    }
  | {
      ok: false;
      reason: IconFetchFailureReason;
      message: string;
    };

export async function fetchIconSvg(iconValue: string): Promise<IconFetchResult> {
  const parsed = parseIconValueStrict(iconValue);
  if (!parsed) {
    return {
      ok: false,
      reason: "invalid-format",
      message: `Invalid icon value "${iconValue}". Expected "si:<slug>" or "ph:<name>".`,
    };
  }

  if (parsed.source === "simple-icons") {
    if (!isSimpleIconSlug(parsed.slug)) {
      return {
        ok: false,
        reason: "unknown-simple-icon",
        message: `Unknown Simple Icons slug "${parsed.slug}" for "${iconValue}".`,
      };
    }
    const svg = SIMPLE_ICONS_BY_SLUG.get(parsed.slug);
    if (!svg) {
      return {
        ok: false,
        reason: "read-failed",
        message: `Simple icon "${parsed.slug}" was not found in the local package dataset.`,
      };
    }

    return { ok: true, svg };
  }

  if (!isPhosphorIconName(parsed.name)) {
    return {
      ok: false,
      reason: "unknown-phosphor-icon",
      message: `Unknown Phosphor icon name "${parsed.name}" for "${iconValue}".`,
    };
  }

  try {
    const response = await fetch(getPhosphorIconSvgUrl(parsed.name));
    if (!response.ok) {
      return {
        ok: false,
        reason: "missing-phosphor-asset",
        message: `Failed to fetch Phosphor icon "${parsed.name}" from CDN (HTTP ${response.status}).`,
      };
    }
    const svg = await response.text();
    return { ok: true, svg };
  } catch {
    return {
      ok: false,
      reason: "read-failed",
      message: `Network error fetching Phosphor icon "${parsed.name}" from CDN.`,
    };
  }
}

export async function svgToDataUri(svgContent: string): Promise<string> {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
}
