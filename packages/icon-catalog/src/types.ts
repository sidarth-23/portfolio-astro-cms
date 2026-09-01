/** A searchable icon entry in a provider's catalog. */
export type IconOption = {
  label: string;
  key: string;
  searchText: string;
};

/** The SVG data returned by a provider's resolve function. */
export type ResolvedIconData = {
  label: string;
  viewBox: string;
  /** Inner SVG content (paths, etc.) — wrap in `<svg class="...">` for custom styling. */
  innerSvg: string;
  /** Full self-contained SVG string — use for data URIs or renderers like Satori. */
  svg: string;
};

/**
 * An icon provider supplies a catalog of icons and a way to resolve them to SVG.
 *
 * To add a new provider:
 *   1. Create `src/providers/your-provider.ts` implementing this interface
 *   2. Add it to the `PROVIDERS` array in `src/providers/index.ts`
 *   3. Done — parsing, resolution, validation, and the admin picker all work automatically.
 */
export type IconProvider = {
  /** Short prefix used in stored values (e.g. `"si"`, `"ph"`). */
  prefix: string;
  /** Identifier used on `ResolvedIcon.source` (e.g. `"simple-icons"`, `"phosphor"`). */
  source: string;
  /** Display name shown as a tab in the admin icon picker. */
  displayName: string;
  /** Optional CSS style applied to preview thumbnails in the admin picker. */
  previewImageStyle?: Record<string, string>;
  /** All available icons, sorted alphabetically by label. */
  options: IconOption[];
  /** Returns true if `key` corresponds to a known icon in this provider. */
  isValidKey: (key: string) => boolean;
  /** CDN URL for an icon preview thumbnail (used in the admin picker). */
  getCdnPreviewUrl: (key: string) => string;
  /** Resolves a key to full SVG data. Returns `null` if the key is unknown. */
  resolve: (key: string) => ResolvedIconData | null;
};
