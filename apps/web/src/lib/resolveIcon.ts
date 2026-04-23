import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import * as simpleIcons from "simple-icons";
import { parseIconValueStrict } from "@sidshub/cms-core/icons/parser";

const require = createRequire(import.meta.url);
const phosphorEntry = require.resolve("@phosphor-icons/core");
const phosphorRoot = dirname(dirname(phosphorEntry));

type IconSource = "simple-icons" | "phosphor";
type IconData = {
  source: IconSource;
  label: string;
  viewBox: string;
  innerSvg: string;
};

type SimpleIconEntry = { title: string; slug: string; path: string };

const SIMPLE_ICONS_BY_SLUG = new Map(
  Object.values(simpleIcons)
    .filter(
      (icon) =>
        typeof icon === "object" &&
        icon !== null &&
        "slug" in icon &&
        "title" in icon &&
        "path" in icon,
    )
    .map((icon) => {
      const entry = icon as SimpleIconEntry;
      return [entry.slug, entry] as const;
    }),
);

const PHOSPHOR_INNER_REGEX = /<svg[^>]*>([\s\S]*?)<\/svg>/i;

const loadSimpleIcon = (slug: string): IconData | null => {
  const icon = SIMPLE_ICONS_BY_SLUG.get(slug);
  if (!icon) return null;
  return {
    source: "simple-icons",
    label: icon.title,
    viewBox: "0 0 24 24",
    innerSvg: `<path d="${icon.path}"/>`,
  };
};

const loadPhosphorIcon = async (name: string): Promise<IconData | null> => {
  if (!/^[a-z0-9-]+$/.test(name)) return null;

  const filePath = join(phosphorRoot, "assets", "regular", `${name}.svg`);
  try {
    const svg = await readFile(filePath, "utf8");
    const innerSvg = svg.match(PHOSPHOR_INNER_REGEX)?.[1]?.trim();
    if (!innerSvg) return null;
    return {
      source: "phosphor",
      label: name,
      viewBox: "0 0 256 256",
      innerSvg,
    };
  } catch {
    return null;
  }
};

const ICON_CACHE = new Map<string, Promise<IconData | null>>();

export const resolveIcon = async (icon?: string | null): Promise<IconData | null> => {
  if (typeof icon !== "string" || icon.trim().length === 0) return null;

  const parsed = parseIconValueStrict(icon);
  if (!parsed) return null;

  const cacheKey = parsed.source === "simple-icons" ? `si:${parsed.slug}` : `ph:${parsed.name}`;
  const existing = ICON_CACHE.get(cacheKey);
  if (existing) return existing;

  const next =
    parsed.source === "simple-icons"
      ? Promise.resolve(loadSimpleIcon(parsed.slug))
      : loadPhosphorIcon(parsed.name);

  ICON_CACHE.set(cacheKey, next);
  return next;
};

export type { IconData };
