import type { BlogPage, CvPage, Media, Post, Project, ProjectsPage, Series, SeriesPage, SiteSetting } from "../../payload-types";

// ---- Type utilities ----

type SeoMeta = { title: string; description: string; image?: (string | number | null) | Media };
type WithSeo = { meta: SeoMeta };
type WithSlug = { slug: string };

/** Keys of T where the value type is (exactly) string */
type StringKeyOf<T> = {
  [K in keyof T]-?: T[K] extends string ? K : never;
}[keyof T] & string;

/**
 * Keys of T where the value type includes the Media interface
 * (i.e. Payload media relationship fields like `(number | null) | Media`)
 */
type MediaKeyOf<T> = {
  [K in keyof T]-?: Extract<T[K], Media> extends never ? never : K;
}[keyof T] & string;

// ---- Internal typed builders (type-checked at definition, erased at runtime) ----

type TitleOpts<T> =
  | { ogTitle?: undefined }         // defaults to meta.title (SEO)
  | { ogTitle: StringKeyOf<T> };    // must be a string field on T

type DescriptionOpts<T> =
  | { ogDescription?: undefined }         // defaults to meta.description (SEO)
  | { ogDescription: StringKeyOf<T> };    // must be a string field on T

type TypedCollectionConfig<T extends WithSeo & WithSlug> = {
  depth?: number;
  existingImage?: MediaKeyOf<T>;    // must be a media field on T
  folderName?: string;
} & TitleOpts<T> & DescriptionOpts<T>;

type TypedGlobalConfig<T extends WithSeo> = {
  folderName?: string;
} & TitleOpts<T> & DescriptionOpts<T>;

// ---- Public runtime types ----

export type CollectionOgTarget = {
  type: "collection";
  slug: string;
  depth?: number;
  ogTitle?: string;        // field name; undefined → use meta.title
  ogDescription?: string;  // field name; undefined → use meta.description
  existingImage?: string;  // field name for existing image
  folderName?: string;
};

export type GlobalOgTarget = {
  type: "global";
  slug: string;
  ogTitle?: string;        // field name; undefined → use meta.title
  ogDescription?: string;  // field name; undefined → use meta.description
  folderName?: string;
};

export type OgTarget = CollectionOgTarget | GlobalOgTarget;

// ---- Builder helpers ----

function collection<T extends WithSeo & WithSlug>(slug: string, config?: TypedCollectionConfig<T>): OgTarget {
  return { type: "collection", slug, ...config };
}

function global<T extends WithSeo>(slug: string, config?: TypedGlobalConfig<T>): OgTarget {
  return { type: "global", slug, ...config };
}

// ---- Registry ----

const DEFAULT_OG_FOLDER_NAME = "Auto Generated";

export const OG_TARGETS: OgTarget[] = [
  collection<Post>("posts", {
    ogTitle: "title",
    existingImage: "coverImage",
    depth: 1,
    folderName: "Auto Generated Posts",
  }),
  collection<Project>("projects", {
    ogTitle: "title",
    existingImage: "image",
    depth: 1,
    folderName: "Auto Generated Projects",
  }),
  collection<Series>("series", { folderName: "Auto Generated Series" }),
  global<CvPage>("cv-page", { folderName: "Auto Generated CV" }),
  global<BlogPage>("blog-page", { folderName: "Auto Generated Blog" }),
  global<SeriesPage>("series-page", { folderName: "Auto Generated Series" }),
  global<ProjectsPage>("projects-page", { folderName: "Auto Generated Projects" }),
  global<SiteSetting>("site-settings", { folderName: DEFAULT_OG_FOLDER_NAME }),
];

/** Collections that have the SEO plugin enabled */
export const SEO_COLLECTIONS = ["posts", "series", "projects"] as const;

/** Globals that have the SEO plugin enabled */
export const SEO_GLOBALS = ["cv-page", "blog-page", "series-page", "projects-page", "site-settings"] as const;
