// ---- Icon fetch types (moved from og/fetchIconSvg) ----

export type IconFetchFailureReason = "invalid-format" | "unknown-icon";

export type SidebarIconDiagnostic = {
  index: number;
  iconValue: string;
  reason: "invalid-format" | "unknown-icon";
  message: string;
};

// ---- OG generation types ----

export type OgGenerationMode = "unset-only" | "replace-all";

export type OgGenerationResult = {
  total: number;
  generated: number;
  skipped: number;
  errors: Array<{ entity: string; error: string }>;
  cleanup: {
    enabled: boolean;
    attempted: number;
    deleted: number;
    skippedReferenced: number;
    failed: number;
    errors: Array<{ entity: string; imageId: string; error: string }>;
  };
  iconDiagnostics: {
    configured: number;
    loaded: number;
    failed: number;
    invalidConfigured: SidebarIconDiagnostic[];
    failedToLoad: Array<{
      index: number;
      iconValue: string;
      reason: IconFetchFailureReason;
      message: string;
    }>;
  };
};

export type GenerateOgImagesOptions = {
  siteUrl?: string;
  wipeOldImages?: boolean;
};

// ---- OG template / render types ----

export type OgTemplateProps = {
  title: string;
  description: string;
  profileImageDataUri?: string;
  socialIconDataUris: string[];
  siteUrl?: string;
};

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
};

// ---- OG target types (public runtime) ----

export type CollectionOgTarget = {
  type: "collection";
  slug: string;
  depth?: number;
  ogTitle?: string;
  ogDescription?: string;
  existingImage?: string;
  folderName?: string;
};

export type GlobalOgTarget = {
  type: "global";
  slug: string;
  ogTitle?: string;
  ogDescription?: string;
  folderName?: string;
};

export type OgTarget = CollectionOgTarget | GlobalOgTarget;

// ---- SEO field mapping type ----

export type SeoFieldMapping = {
  titleField: string;
  descriptionField: string;
  imageField: string | null;
};

// ---- Plugin option types ----

/**
 * Per-collection override for OG image generation.
 * Field names are strings validated at definition time via typesafe builder helpers.
 */
export type CollectionOgOverride = {
  /** Field name to use as OG title. Defaults to meta.title. */
  ogTitle?: string;
  /** Field name to use as OG description. Defaults to meta.description. */
  ogDescription?: string;
  /** Field name for an existing cover image (skips generation if already set in unset-only mode). */
  existingImage?: string;
  /** Payload depth when fetching docs for generation. Defaults to 0. */
  depth?: number;
  /** Folder name in media collection for generated images. Overrides defaultFolderName. */
  folderName?: string;
  /** SEO field mapping for auto-population hook and SEO button diff check. */
  seoFieldMapping?: SeoFieldMapping;
};

/**
 * Per-global override for OG image generation.
 */
export type GlobalOgOverride = {
  ogTitle?: string;
  ogDescription?: string;
  folderName?: string;
};

export type OgImagePluginOptions = {
  /** The public site URL. Used in OG templates and SocialCardPreview. Required. */
  siteUrl: string;

  /** Default folder name for generated OG images. Defaults to "Auto Generated". */
  defaultFolderName?: string;

  /**
   * Per-collection overrides keyed by collection slug.
   * Only SEO-enabled collections (those with meta fields from seoPlugin) are processed.
   * Extra keys are warned and ignored at plugin initialization.
   */
  collections?: Record<string, CollectionOgOverride>;

  /**
   * Per-global overrides keyed by global slug.
   * Only SEO-enabled globals are processed.
   */
  globals?: Record<string, GlobalOgOverride>;

  /**
   * Control SEO-aware button injection per collection.
   *
   * - Omit (default): auto-detects from collection.versions — versioned collections
   *   get "draft-and-publish", non-versioned get "save-only".
   * - false: disable all button injection.
   * - Record: set per-collection overrides. Falsy value = skip that collection.
   */
  seoButtons?: false | Record<string, "draft-and-publish" | "save-only" | false>;

  /**
   * Whether to inject the SocialCardPreview UI field into the SEO tab.
   * Defaults to true.
   */
  injectSocialCardPreview?: boolean;

  /**
   * Whether to inject the suggestMetadataAutoPopulation beforeChange hook on
   * collections that have a seoFieldMapping defined in their CollectionOgOverride.
   * Defaults to true.
   */
  injectAutoPopulationHook?: boolean;

  /**
   * Whether to make the SEO title and description fields required.
   * Defaults to true.
   */
  makeSeoFieldsRequired?: boolean;
};

// ---- Typesafe builder helpers ----

// Internal type utilities (only available via the helpers below)

type StringKeyOf<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never;
}[keyof T] &
  string;

type MediaLike = { id: string | number; url?: string | null };

type MediaKeyOf<T> = {
  [K in keyof T]-?: Extract<NonNullable<T[K]>, MediaLike> extends never ? never : K;
}[keyof T] &
  string;

type SeoMeta = { title: string; description: string; image?: unknown };
type WithSeo = { meta: SeoMeta };
type WithSlug = { slug: string };

/**
 * Typesafe options for a collection OG override.
 * Field names are constrained to actual keys of T.
 */
export type TypedCollectionOverride<T extends WithSeo & WithSlug> = {
  ogTitle?: StringKeyOf<T>;
  ogDescription?: StringKeyOf<T>;
  existingImage?: MediaKeyOf<T>;
  depth?: number;
  folderName?: string;
  seoFieldMapping?: {
    titleField: StringKeyOf<T>;
    descriptionField: StringKeyOf<T>;
    imageField: MediaKeyOf<T> | null;
  };
};

/**
 * Typesafe options for a global OG override.
 * Field names are constrained to actual keys of T.
 */
export type TypedGlobalOverride<T extends WithSeo> = {
  ogTitle?: StringKeyOf<T>;
  ogDescription?: StringKeyOf<T>;
  folderName?: string;
};

/**
 * Type-checked builder for a collection OG override.
 * Use this in your ogImagePlugin() options to get field name validation:
 *
 * @example
 * import type { Post } from "@/payload-types";
 * collections: {
 *   posts: collectionOverride<Post>({ ogTitle: "title", existingImage: "coverImage" })
 * }
 */
export function collectionOverride<T extends WithSeo & WithSlug>(
  override: TypedCollectionOverride<T>,
): CollectionOgOverride {
  return override as CollectionOgOverride;
}

/**
 * Type-checked builder for a global OG override.
 */
export function globalOverride<T extends WithSeo>(
  override: TypedGlobalOverride<T>,
): GlobalOgOverride {
  return override as GlobalOgOverride;
}
