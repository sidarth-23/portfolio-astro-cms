import * as simpleIcons from "simple-icons";
import { icons as phosphorIcons } from "@phosphor-icons/core";

// ---- Shared types ----

export type SimpleIconValue = { source: "simple-icons"; slug: string };
export type PhosphorIconValue = { source: "phosphor"; name: string };
export type ParsedIconValue = SimpleIconValue | PhosphorIconValue;

// ---- Icon datasets ----

type SimpleIconEntry = { slug: string; svg: string };

/**
 * Map of simple-icons slug → SVG string.
 * Used both for validation (has()) and for fetching content (get()).
 */
export const SIMPLE_ICONS_BY_SLUG = new Map(
  Object.values(simpleIcons)
    .filter((icon): icon is SimpleIconEntry => {
      return typeof icon === "object" && icon !== null && "slug" in icon && "svg" in icon;
    })
    .map((icon) => [icon.slug, icon.svg] as const),
);

export const PHOSPHOR_ICON_NAMES = new Set(phosphorIcons.map((icon) => icon.name));

// ---- Parsing ----

export function parseIconValueStrict(value: unknown): ParsedIconValue | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("si:")) {
    const slug = trimmed.slice(3).trim();
    return slug ? { source: "simple-icons", slug } : null;
  }

  if (trimmed.startsWith("ph:")) {
    const name = trimmed.slice(3).trim();
    return name ? { source: "phosphor", name } : null;
  }

  return null;
}

// ---- Validation helpers ----

export function isSimpleIconSlug(slug: string): boolean {
  return SIMPLE_ICONS_BY_SLUG.has(slug);
}

export function isPhosphorIconName(name: string): boolean {
  return PHOSPHOR_ICON_NAMES.has(name);
}
