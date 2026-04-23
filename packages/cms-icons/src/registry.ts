import { PROVIDERS } from "./providers";
import type { IconOption, IconProvider, ResolvedIconData } from "./types";

// ---- Public types ----

export type { IconProvider, IconOption };

/** The result of resolving an icon value to SVG, annotated with its provider's source. */
export type ResolvedIcon = ResolvedIconData & {
  source: string;
};

/** The result of parsing an `"prefix:key"` icon value string. */
export type ParsedIconValue = {
  provider: IconProvider;
  key: string;
};

// ---- Build prefix → provider lookup once at module load ----

const PROVIDER_BY_PREFIX = new Map(PROVIDERS.map((p) => [p.prefix, p]));

// ---- Parsing ----

/**
 * Parses a stored icon value (e.g. `"si:github"`, `"ph:house"`) into the matched
 * provider and key. Returns `null` for unrecognised formats or unknown prefixes.
 */
export function parseIconValue(value: unknown): ParsedIconValue | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const colonIdx = trimmed.indexOf(":");
  if (colonIdx < 1) return null;

  const prefix = trimmed.slice(0, colonIdx);
  const key = trimmed.slice(colonIdx + 1).trim();
  if (!key) return null;

  const provider = PROVIDER_BY_PREFIX.get(prefix);
  return provider ? { provider, key } : null;
}

/**
 * Returns `true` if the value is a valid, known icon across all registered providers.
 * Useful for schema validation.
 */
export function isValidIconValue(value: unknown): boolean {
  const parsed = parseIconValue(value);
  return parsed !== null && parsed.provider.isValidKey(parsed.key);
}

// ---- Search ----

/**
 * Fuzzy-searches a provider's catalog. Starts-with matches are ranked above
 * substring matches.
 */
export function findIconOptions(provider: IconProvider, query: string, limit = 12): IconOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return provider.options.slice(0, limit);

  const startsWith = provider.options.filter(
    (opt) => opt.key.startsWith(q) || opt.label.toLowerCase().startsWith(q),
  );
  const rest = provider.options.filter(
    (opt) => !startsWith.includes(opt) && opt.searchText.includes(q),
  );

  return [...startsWith, ...rest].slice(0, limit);
}

// ---- Resolution ----

/**
 * Resolves a stored icon value (e.g. `"si:github"`) to its SVG data.
 * Returns `null` for unknown values.
 */
export function resolveIconSvg(iconValue: string): ResolvedIcon | null {
  const parsed = parseIconValue(iconValue);
  if (!parsed) return null;

  const data = parsed.provider.resolve(parsed.key);
  if (!data) return null;

  return { ...data, source: parsed.provider.source };
}

// ---- Utilities ----

/** Converts a full SVG string to a `data:image/svg+xml,...` URI. */
export function svgToDataUri(svgContent: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
}

// ---- Provider access ----

/** All registered icon providers, in display order. Useful for iteration. */
export { PROVIDERS };
