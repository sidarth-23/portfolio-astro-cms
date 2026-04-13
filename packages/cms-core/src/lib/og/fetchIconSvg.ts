import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

import * as simpleIcons from "simple-icons";

import { parseIconValueStrict } from "../icons";

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

const PHOSPHOR_DIST_PATH = require.resolve("@phosphor-icons/core");
const PHOSPHOR_PACKAGE_ROOT = path.dirname(path.dirname(PHOSPHOR_DIST_PATH));

const getPhosphorSvgPath = (name: string): string => {
  return path.join(PHOSPHOR_PACKAGE_ROOT, "assets", "regular", `${name}.svg`);
};

export async function fetchIconSvg(iconValue: string): Promise<string | null> {
  const parsed = parseIconValueStrict(iconValue);
  if (!parsed) return null;

  if (parsed.source === "simple-icons") {
    return SIMPLE_ICONS_BY_SLUG.get(parsed.slug) ?? null;
  }

  try {
    const svgPath = getPhosphorSvgPath(parsed.name);
    return await readFile(svgPath, "utf-8");
  } catch {
    return null;
  }
}

export async function svgToDataUri(svgContent: string): Promise<string> {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
}
