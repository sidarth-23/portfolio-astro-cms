import * as simpleIcons from "simple-icons";
import type { IconOption, IconProvider } from "../types";

// ---- Internal types ----

type SimpleIconEntry = {
  title: string;
  slug: string;
  path: string;
  svg: string;
  aliases?: {
    aka?: string[];
    dup?: { title?: string }[];
    old?: string[];
  };
};

// ---- Data ----

const sourceEntries = Object.values(simpleIcons).filter((icon) => {
  return (
    typeof icon === "object" &&
    icon !== null &&
    "title" in icon &&
    "slug" in icon &&
    "path" in icon &&
    "svg" in icon
  );
});

const ICONS_BY_KEY = new Map(sourceEntries.map((icon) => [icon.slug, icon]));

const buildSearchText = (icon: SimpleIconEntry): string => {
  const aliasTitles =
    icon.aliases?.dup
      ?.map((entry) => entry.title)
      .filter((title): title is string => Boolean(title)) ?? [];

  return [
    icon.title,
    icon.slug,
    ...(icon.aliases?.aka ?? []),
    ...(icon.aliases?.old ?? []),
    ...aliasTitles,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const ALL_OPTIONS: IconOption[] = sourceEntries
  .map((icon) => ({ label: icon.title, key: icon.slug, searchText: buildSearchText(icon) }))
  .sort((a, b) => a.label.localeCompare(b.label));

// ---- Provider ----

export const simpleIconsProvider: IconProvider = {
  prefix: "si",
  source: "simple-icons",
  displayName: "Simple Icons",

  options: ALL_OPTIONS,

  isValidKey: (key) => ICONS_BY_KEY.has(key),

  getCdnPreviewUrl: (key, size = 18) => {
    return `https://cdn.simpleicons.org/${key}/ffffff?viewbox=auto&size=${size}`;
  },

  resolve: (key) => {
    const icon = ICONS_BY_KEY.get(key);
    if (!icon) return null;
    return {
      label: icon.title,
      viewBox: "0 0 24 24",
      innerSvg: `<path d="${icon.path}"/>`,
      svg: icon.svg,
    };
  },
};
