import type { Post, Series } from "@sidshub/cms/payload-types";

type HomeCtaVariant = "default" | "primary" | "secondary" | "accent" | "outline" | "ghost";

export type PostFilterOptions = {
  slug?: string;
  categorySlug?: string;
  seriesSlug?: string;
  search?: string;
};

export type PublishedPostsQueryOptions = PostFilterOptions & {
  page?: number;
  pageSize?: number;
  limit?: number;
  depth?: number;
  sort?: string;
};

export type PaginatedPosts = {
  docs: Post[];
  page: number;
  pageSize: number;
  totalDocs: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type TagInfo = { name: string; slug: string };
export type CategoryInfo = { name: string; slug: string };
export type SeriesInfo = { name: string; slug: string };

export type SeriesStaticPathData = {
  slug: string;
  series: Series;
  posts: Post[];
};

export type HomeCtaButton = {
  title: string;
  href: string;
  variant: HomeCtaVariant;
  newTab: boolean;
};
