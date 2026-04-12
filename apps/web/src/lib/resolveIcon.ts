import { icons as phosphorIconCatalog } from "@phosphor-icons/core";
import { parseIconValueStrict } from "@sidshub/cms-config/icon-value";
import { PhLink } from "phosphor-icons-astro";
import * as phosphorIcons from "phosphor-icons-astro";
import * as simpleIcons from "simple-icons";

type SimpleIconEntry = {
  slug: string;
  path: string;
  title: string;
};

const SIMPLE_ICONS = Object.values(simpleIcons).filter((icon) => {
  return (
    typeof icon === "object" &&
    icon !== null &&
    "slug" in icon &&
    "path" in icon &&
    "title" in icon
  );
}) as SimpleIconEntry[];

const SIMPLE_ICONS_BY_SLUG = new Map(
  SIMPLE_ICONS.map((icon) => [icon.slug, icon]),
);

type PhosphorIconComponent = typeof PhLink;
const PHOSPHOR_ICON_COMPONENTS = phosphorIcons as Record<
  string,
  PhosphorIconComponent
>;
const PHOSPHOR_PASCAL_BY_NAME = new Map<string, string>(
  phosphorIconCatalog.map((icon) => [icon.name, icon.pascal_name]),
);

export type IconData =
  | { source: "simple-icons"; path: string; title: string }
  | { source: "phosphor"; component: PhosphorIconComponent; name: string };

const resolvePhosphorIcon = (name: string): IconData | null => {
  const pascalName = PHOSPHOR_PASCAL_BY_NAME.get(name);
  if (!pascalName) return null;

  const component = PHOSPHOR_ICON_COMPONENTS[`Ph${pascalName}`];
  if (!component) return null;

  return { source: "phosphor", component, name };
};

export const resolveIcon = (icon?: string | null): IconData | null => {
  if (typeof icon !== "string" || icon.trim().length === 0) {
    return null;
  }

  const parsed = parseIconValueStrict(icon);
  if (!parsed) {
    throw new Error(`Invalid icon value "${icon}". Expected "si:<slug>" or "ph:<name>".`);
  }

  if (parsed.source === "simple-icons") {
    const simpleIcon = SIMPLE_ICONS_BY_SLUG.get(parsed.slug);
    if (!simpleIcon) throw new Error(`Unknown Simple Icons slug "${parsed.slug}" for icon "${icon}".`);
    return {
      source: "simple-icons",
      path: simpleIcon.path,
      title: simpleIcon.title,
    };
  }

  const phosphorIcon = resolvePhosphorIcon(parsed.name);
  if (!phosphorIcon) throw new Error(`Unknown Phosphor icon "${parsed.name}" for icon "${icon}".`);

  return phosphorIcon;
};
