import type { Post } from "@sidshub/cms-core/payload-types";
import type { HomeCtaVariant } from "@sidshub/cms-core/content";

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
  series: import("@sidshub/cms-core/payload-types").Series;
  posts: Post[];
};

export type HomeCtaButton = {
  title: string;
  href: string;
  variant: HomeCtaVariant;
  newTab: boolean;
};
