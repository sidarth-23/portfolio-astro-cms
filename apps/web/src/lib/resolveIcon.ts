import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { parseIconValueStrict } from "@sidshub/cms-core/icons/parser";

const require = createRequire(import.meta.url);
const simpleIconsEntry = require.resolve("simple-icons");
const simpleIconsRoot = dirname(simpleIconsEntry);
const phosphorEntry = require.resolve("@phosphor-icons/core");
const phosphorRoot = dirname(dirname(phosphorEntry));

const ICON_CACHE = new Map<string, Promise<IconData | null>>();

const SVG_TAG_REGEX = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/i;
const VIEWBOX_REGEX = /\bviewBox=(['"])(.*?)\1/i;
const SCRIPT_TAG_REGEX = /<script[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_ATTR_REGEX = /\son[a-z]+\s*=\s*(['"]).*?\1/gi;
const FILL_COLOR_ATTR_REGEX = /\sfill\s*=\s*(['"])(?!none|currentColor).*?\1/gi;
const STROKE_COLOR_ATTR_REGEX = /\sstroke\s*=\s*(['"])(?!none|currentColor).*?\1/gi;

type IconSource = "simple-icons" | "phosphor";
type IconData = {
  source: IconSource;
  label: string;
  viewBox: string;
  innerSvg: string;
};

const normalizeSvg = (rawSvg: string): { viewBox: string; innerSvg: string } | null => {
  const match = rawSvg.match(SVG_TAG_REGEX);
  if (!match) {
    return null;
  }

  const attrs = match[1] ?? "";
  const viewBoxMatch = attrs.match(VIEWBOX_REGEX);
  const viewBox = viewBoxMatch?.[2] ?? "0 0 24 24";
  const innerSvg = (match[2] ?? "")
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(EVENT_HANDLER_ATTR_REGEX, "")
    .replace(FILL_COLOR_ATTR_REGEX, "")
    .replace(STROKE_COLOR_ATTR_REGEX, "");

  if (!innerSvg.trim()) {
    return null;
  }

  return { viewBox, innerSvg };
};

const loadSvgIcon = async (source: IconSource, key: string): Promise<IconData | null> => {
  const safeKey = source === "simple-icons" ? /^[a-z0-9]+$/ : /^[a-z0-9-]+$/;
  if (!safeKey.test(key)) {
    return null;
  }

  const filePath =
    source === "simple-icons"
      ? join(simpleIconsRoot, "icons", `${key}.svg`)
      : join(phosphorRoot, "assets", "regular", `${key}.svg`);

  try {
    const svg = await readFile(filePath, "utf8");
    const normalized = normalizeSvg(svg);
    if (!normalized) {
      return null;
    }
    return {
      source,
      label: key,
      viewBox: normalized.viewBox,
      innerSvg: normalized.innerSvg,
    };
  } catch {
    return null;
  }
};

export const resolveIcon = async (icon?: string | null): Promise<IconData | null> => {
  if (typeof icon !== "string" || icon.trim().length === 0) {
    return null;
  }

  const parsed = parseIconValueStrict(icon);
  if (!parsed) {
    return null;
  }

  const cacheKey = parsed.source === "simple-icons" ? `si:${parsed.slug}` : `ph:${parsed.name}`;
  const existing = ICON_CACHE.get(cacheKey);
  if (existing) {
    return existing;
  }

  const next =
    parsed.source === "simple-icons"
      ? loadSvgIcon("simple-icons", parsed.slug)
      : loadSvgIcon("phosphor", parsed.name);

  ICON_CACHE.set(cacheKey, next);
  return next;
};

export type { IconData };
