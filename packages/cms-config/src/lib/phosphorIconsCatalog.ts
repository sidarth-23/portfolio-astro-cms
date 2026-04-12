import { icons } from "@phosphor-icons/core";

export type PhosphorIconOption = {
  name: string;
  pascalName: string;
  searchText: string;
};

export const PHOSPHOR_ICON_OPTIONS: PhosphorIconOption[] = icons
  .map((icon) => {
    return {
      name: icon.name,
      pascalName: icon.pascal_name,
      searchText: (icon.name + " " + icon.tags.join(" ")).toLowerCase(),
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));

const PHOSPHOR_ICON_NAMES = new Set(PHOSPHOR_ICON_OPTIONS.map((icon) => icon.name));

export const findPhosphorIconOptions = (query: string, limit = 12): PhosphorIconOption[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return PHOSPHOR_ICON_OPTIONS.slice(0, limit);
  }

  const startsWithMatches = PHOSPHOR_ICON_OPTIONS.filter(
    (icon) => icon.name.startsWith(normalizedQuery) || icon.pascalName.toLowerCase().startsWith(normalizedQuery),
  );

  const remainingMatches = PHOSPHOR_ICON_OPTIONS.filter(
    (icon) => !startsWithMatches.includes(icon) && icon.searchText.includes(normalizedQuery),
  );

  return [...startsWithMatches, ...remainingMatches].slice(0, limit);
};

export const isPhosphorIconName = (value: unknown): boolean => {
  return typeof value === "string" && PHOSPHOR_ICON_NAMES.has(value.trim());
};

export const getPhosphorIconSvgUrl = (name: string): string => {
  return `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/regular/${name}.svg`;
};
