import type { Post, SiteSetting, Media, User } from "../payload-types";

export type Params = Record<string, string | number | boolean | undefined>;

export type PostFilterOptions = {
  slug?: string;
  tagSlug?: string;
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

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type RelationValue<T> = number | T | null | undefined;

export type PopulatedAuthor = {
  id?: number | null;
  name?: string | null;
  bio?: User["bio"];
  avatar?: RelationValue<Media>;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
};

export type SiteFooterItem = NonNullable<SiteSetting["sidebarFooterItems"]>[number];
export type SiteFooterItemType = SiteFooterItem["type"];
