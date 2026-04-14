import type { Post, Media, User } from "../../payload-types";

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

export type RelationValue<T> = string | number | T | null | undefined;

export type PopulatedAuthor = {
  id?: string | number | null;
  name?: string | null;
  bio?: User["bio"];
  avatar?: RelationValue<Media>;
  links?: Array<{ icon?: string | null; url?: string | null; newTab?: boolean | null }>;
};

export type ProjectLink = {
  icon: string;
  url: string;
  newTab: boolean;
};

export type SiteFooterItem = {
  icon: string;
  url: string;
  newTab: boolean;
};
