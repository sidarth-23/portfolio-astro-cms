import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import * as simpleIcons from "simple-icons";

import { isPhosphorIconName, isSimpleIconSlug, parseIconValueStrict } from "../icons";

type SimpleIconEntry = {
  slug: string;
  svg: string;
};

const require = createRequire(import.meta.url);

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

const resolvePhosphorSvgPath = (name: string): string | null => {
  try {
    return require.resolve(`@phosphor-icons/core/assets/regular/${name}.svg`);
  } catch {
    return null;
  }
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

  const svgPath = resolvePhosphorSvgPath(parsed.name);
  if (!svgPath) {
    return {
      ok: false,
      reason: "missing-phosphor-asset",
      message: `Local Phosphor asset not found for icon "${parsed.name}" (expected regular weight SVG).`,
    };
  }

  try {
    const svg = await readFile(svgPath, "utf-8");
    return { ok: true, svg };
  } catch {
    return {
      ok: false,
      reason: "read-failed",
      message: `Failed to read local Phosphor SVG for "${parsed.name}".`,
    };
  }
}

export async function svgToDataUri(svgContent: string): Promise<string> {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
}
