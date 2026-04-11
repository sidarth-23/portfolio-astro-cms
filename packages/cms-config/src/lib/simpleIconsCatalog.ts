import * as simpleIcons from "simple-icons";

type SimpleIconAliasGroups = {
  aka?: string[];
  dup?: { title?: string }[];
  old?: string[];
};

type SimpleIconEntry = {
  title: string;
  slug: string;
  aliases?: SimpleIconAliasGroups;
};

export type SimpleIconOption = {
  title: string;
  slug: string;
  searchText: string;
};

const sourceEntries = Object.values(simpleIcons).filter((icon) => {
  return typeof icon === "object" && icon !== null && "title" in icon && "slug" in icon;
}) as SimpleIconEntry[];

const getSearchTerms = (icon: SimpleIconEntry): string[] => {
  const aliasTitles = icon.aliases?.dup?.map((entry) => entry.title).filter((value): value is string => Boolean(value)) ?? [];

  return [icon.title, icon.slug, ...(icon.aliases?.aka ?? []), ...(icon.aliases?.old ?? []), ...aliasTitles].filter(
    (value): value is string => Boolean(value),
  );
};

export const SIMPLE_ICON_OPTIONS: SimpleIconOption[] = sourceEntries
  .map((icon) => {
    return {
      title: icon.title,
      slug: icon.slug,
      searchText: getSearchTerms(icon).join(" ").toLowerCase(),
    };
  })
  .sort((left, right) => left.title.localeCompare(right.title));

const SIMPLE_ICON_SLUGS = new Set(SIMPLE_ICON_OPTIONS.map((icon) => icon.slug));

export const findSimpleIconOptions = (query: string, limit = 12): SimpleIconOption[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return SIMPLE_ICON_OPTIONS.slice(0, limit);
  }

  const startsWithMatches = SIMPLE_ICON_OPTIONS.filter(
    (icon) => icon.slug.startsWith(normalizedQuery) || icon.title.toLowerCase().startsWith(normalizedQuery),
  );

  const remainingMatches = SIMPLE_ICON_OPTIONS.filter(
    (icon) => !startsWithMatches.includes(icon) && icon.searchText.includes(normalizedQuery),
  );

  return [...startsWithMatches, ...remainingMatches].slice(0, limit);
};

export const getSimpleIconCdnUrl = (slug: string): string => {
  return `https://cdn.simpleicons.org/${slug}?viewbox=auto&size=18`;
};

export const isSimpleIconSlug = (value: unknown): boolean => {
  return typeof value === "string" && SIMPLE_ICON_SLUGS.has(value.trim());
};
