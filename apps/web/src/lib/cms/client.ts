import { ASTRO_CMS_API_URL, ASTRO_CMS_READ_TOKEN } from "astro:env/server";

import type {
  BlogPage,
  Category,
  CvPage,
  HomePage,
  Media,
  NotFoundPage,
  Post,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
  Tag,
  User,
} from "@sidshub/cms-config/payload-types";
import {
  asCategory,
  asPopulatedAuthors,
  asSeries,
  asSiteFooterItems,
  asTagArray,
  asUserArray,
  type PopulatedAuthor,
} from "@/lib/cms/guards";
import type { PayloadListResponse } from "@/lib/cms/types";

const API_BASE = ASTRO_CMS_API_URL.replace(/\/$/, "");
const READ_TOKEN = ASTRO_CMS_READ_TOKEN;

type Params = Record<string, string | number | boolean | undefined>;

type PostFilterOptions = {
  slug?: string;
  tagSlug?: string;
  categorySlug?: string;
  seriesSlug?: string;
  search?: string;
};

type PublishedPostsQueryOptions = PostFilterOptions & {
  page?: number;
  pageSize?: number;
  limit?: number;
  depth?: number;
  sort?: string;
};

type PaginatedPosts = {
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

type TaxonomyDoc = {
  slug?: string | null;
};

const responseSnippet = (value: string): string => {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
};

const toAbsoluteMediaUrl = (media: Media | string | number | null | undefined): string | undefined => {
  if (!media) {
    return undefined;
  }

  if (typeof media === "string") {
    return media;
  }

  if (typeof media === "number") {
    return undefined;
  }

  if (!media.url) {
    return undefined;
  }

  return media.url.startsWith("http") ? media.url : `${API_BASE.replace(/\/api$/, "")}${media.url}`;
};

const buildUrl = (path: string, params?: Params): string => {
  const url = new URL(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const payloadFetch = async <T>(path: string, params?: Params): Promise<T> => {
  const url = buildUrl(path, params);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${READ_TOKEN}`,
  };

  let response: Response;

  try {
    response = await fetch(url, {
      headers,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Payload fetch failed for ${path} (${url}): network error: ${reason}`);
  }

  const rawBody = await response.text();
  const snippet = rawBody ? responseSnippet(rawBody) : "";

  if (!response.ok) {
    const details = snippet ? ` Response: ${snippet}` : "";
    throw new Error(
      `Payload fetch failed for ${path} (${url}) with status ${response.status} ${response.statusText}.${details}`,
    );
  }

  if (!rawBody) {
    throw new Error(
      `Payload fetch failed for ${path} (${url}) with status ${response.status} ${response.statusText}: empty response body.`,
    );
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const details = snippet ? ` Response: ${snippet}` : "";
    throw new Error(`Payload fetch failed for ${path} (${url}): invalid JSON response (${reason}).${details}`);
  }
};

const buildPublishedWhereParams = (options: PostFilterOptions = {}): Params => {
  const params: Params = {};

  if (options.search) {
    let andIndex = 0;

    params[`where[and][${andIndex}][_status][equals]`] = "published";
    andIndex++;

    params[`where[and][${andIndex}][or][0][title][like]`] = options.search;
    params[`where[and][${andIndex}][or][1][excerpt][like]`] = options.search;
    andIndex++;

    if (options.slug) {
      params[`where[and][${andIndex}][slug][equals]`] = options.slug;
      andIndex++;
    }

    if (options.tagSlug) {
      params[`where[and][${andIndex}][tags.slug][equals]`] = options.tagSlug;
      andIndex++;
    }

    if (options.categorySlug) {
      params[`where[and][${andIndex}][primaryCategory.slug][equals]`] = options.categorySlug;
      andIndex++;
    }

    if (options.seriesSlug) {
      params[`where[and][${andIndex}][series.slug][equals]`] = options.seriesSlug;
      andIndex++;
    }

  } else {
    params["where[_status][equals]"] = "published";

    if (options.slug) {
      params["where[slug][equals]"] = options.slug;
    }

    if (options.tagSlug) {
      params["where[tags.slug][equals]"] = options.tagSlug;
    }

    if (options.categorySlug) {
      params["where[primaryCategory.slug][equals]"] = options.categorySlug;
    }

    if (options.seriesSlug) {
      params["where[series.slug][equals]"] = options.seriesSlug;
    }

  }

  return params;
};

const buildPublishedPostsQueryParams = (options: PublishedPostsQueryOptions = {}): Params => {
  const params: Params = {
    depth: options.depth ?? 3,
    sort: options.sort ?? "-publishedAt",
    ...buildPublishedWhereParams(options),
  };

  if (options.page !== undefined) {
    params.page = options.page;
  }

  if (options.pageSize !== undefined) {
    params.limit = options.pageSize;
  }

  if (options.limit !== undefined) {
    params.limit = options.limit;
  }

  return params;
};

const fetchPublishedPostsPage = async (
  options: PublishedPostsQueryOptions = {},
): Promise<PayloadListResponse<Post>> => {
  return payloadFetch<PayloadListResponse<Post>>("/posts", buildPublishedPostsQueryParams(options));
};

const sortPosts = (posts: Post[]): Post[] => {
  return posts.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
};

const isPublishedPostRelation = (value: number | Post | null | undefined): value is Post => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const fetchAllTaxonomySlugs = async (path: "/tags" | "/categories" | "/series"): Promise<string[]> => {
  const limit = 200;
  const firstPage = await payloadFetch<PayloadListResponse<TaxonomyDoc>>(path, {
    page: 1,
    limit,
    sort: "slug",
    depth: 0,
  });

  const docs = [...firstPage.docs];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await payloadFetch<PayloadListResponse<TaxonomyDoc>>(path, {
      page,
      limit,
      sort: "slug",
      depth: 0,
    });
    docs.push(...nextPage.docs);
  }

  return docs
    .map((doc) => doc.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
};

const hasPublishedPosts = async (filters: Pick<PostFilterOptions, "tagSlug" | "categorySlug" | "seriesSlug">): Promise<boolean> => {
  const result = await fetchPublishedPostsPage({
    ...filters,
    limit: 1,
    depth: 0,
  });

  return result.totalDocs > 0;
};

export const getSiteSettings = async (): Promise<SiteSetting> => {
  return payloadFetch<SiteSetting>("/globals/site-settings", { depth: 2 });
};

export const getHomePage = async (): Promise<HomePage> => {
  return payloadFetch<HomePage>("/globals/home-page", { depth: 2 });
};

export const getCvPage = async (): Promise<CvPage> => {
  return payloadFetch<CvPage>("/globals/cv-page", { depth: 2 });
};

export const getProjectsPage = async (): Promise<ProjectsPage> => {
  return payloadFetch<ProjectsPage>("/globals/projects-page", { depth: 2 });
};

export const getSeriesPage = async (): Promise<SeriesPage> => {
  return payloadFetch<SeriesPage>("/globals/series-page", { depth: 2 });
};

export const getNotFoundPage = async (): Promise<NotFoundPage> => {
  return payloadFetch<NotFoundPage>("/globals/not-found-page", { depth: 2 });
};

export const getAllPublishedPosts = async (
  filters: Omit<PostFilterOptions, "slug"> = {},
): Promise<Post[]> => {
  const limit = 100;
  const firstPage = await fetchPublishedPostsPage({
    ...filters,
    page: 1,
    pageSize: limit,
  });

  const rawPosts = [...firstPage.docs];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await fetchPublishedPostsPage({
      ...filters,
      page,
      pageSize: limit,
    });
    rawPosts.push(...nextPage.docs);
  }

  return sortPosts(rawPosts);
};

export const getPaginatedPublishedPosts = async ({
  page,
  pageSize,
  tagSlug,
  categorySlug,
  seriesSlug,
  search,
}: {
  page: number;
  pageSize: number;
  tagSlug?: string;
  categorySlug?: string;
  seriesSlug?: string;
  search?: string;
}): Promise<PaginatedPosts> => {
  const response = await fetchPublishedPostsPage({
    page,
    pageSize,
    tagSlug,
    categorySlug,
    seriesSlug,
    search,
  });

  return {
    docs: response.docs,
    page: response.page,
    pageSize: response.limit,
    totalDocs: response.totalDocs,
    totalPages: response.totalPages,
    hasPrevPage: response.hasPrevPage,
    hasNextPage: response.hasNextPage,
    prevPage: response.prevPage,
    nextPage: response.nextPage,
  };
};

export const getPostBySlug = async (slug: string): Promise<Post | null> => {
  const response = await fetchPublishedPostsPage({
    slug,
    limit: 1,
  });
  const rawPost = response.docs[0];

  if (!rawPost) {
    return null;
  }

  return rawPost;
};

export const getTagSlugs = async (): Promise<string[]> => {
  const allTagSlugs = await fetchAllTaxonomySlugs("/tags");
  const hasPostsByTag = await Promise.all(
    allTagSlugs.map(async (tagSlug) => {
      return {
        tagSlug,
        hasPosts: await hasPublishedPosts({ tagSlug }),
      };
    }),
  );

  return hasPostsByTag
    .filter((item) => item.hasPosts)
    .map((item) => item.tagSlug)
    .sort((a, b) => a.localeCompare(b));
};

export const getCategorySlugs = async (): Promise<string[]> => {
  const allCategorySlugs = await fetchAllTaxonomySlugs("/categories");
  const hasPostsByCategory = await Promise.all(
    allCategorySlugs.map(async (categorySlug) => {
      return {
        categorySlug,
        hasPosts: await hasPublishedPosts({ categorySlug }),
      };
    }),
  );

  return hasPostsByCategory
    .filter((item) => item.hasPosts)
    .map((item) => item.categorySlug)
    .sort((a, b) => a.localeCompare(b));
};

export const mediaToUrl = toAbsoluteMediaUrl;

export const categoryFromPost = (post: Post): { name: string; slug: string } | undefined => {
  const category = asCategory(post.primaryCategory);
  if (!category) {
    return undefined;
  }

  return {
    name: category.name,
    slug: category.slug,
  };
};

export const tagsFromPost = (post: Post): Array<{ name: string; slug: string }> => {
  return asTagArray(post.tags).map((tag) => ({
    name: tag.name,
    slug: tag.slug,
  }));
};

export const seriesFromPost = (post: Post): { name: string; slug: string } | undefined => {
  const series = asSeries(post.series);
  if (!series) {
    return undefined;
  }

  return { name: series.name, slug: series.slug };
};

export const getSeriesSlugs = async (): Promise<string[]> => {
  const allSeriesSlugs = await fetchAllTaxonomySlugs("/series");
  const hasPostsBySeries = await Promise.all(
    allSeriesSlugs.map(async (seriesSlug) => {
      return {
        seriesSlug,
        hasPosts: await hasPublishedPosts({ seriesSlug }),
      };
    }),
  );

  return hasPostsBySeries
    .filter((item) => item.hasPosts)
    .map((item) => item.seriesSlug)
    .sort((a, b) => a.localeCompare(b));
};

export const getPostsBySeries = async (seriesSlug: string): Promise<Post[]> => {
  const response = await payloadFetch<PayloadListResponse<Series>>("/series", {
    depth: 3,
    limit: 1,
    "where[slug][equals]": seriesSlug,
  });

  const series = response.docs[0];
  if (!series?.posts || series.posts.length === 0) {
    return [];
  }

  return series.posts.filter(isPublishedPostRelation);
};

export const getSeriesBySlug = async (slug: string): Promise<Series | null> => {
  const response = await payloadFetch<PayloadListResponse<Series>>("/series", {
    depth: 2,
    limit: 1,
    "where[slug][equals]": slug,
  });

  return response.docs[0] ?? null;
};

export const getAllCategories = async (): Promise<Category[]> => {
  const limit = 200;
  const firstPage = await payloadFetch<PayloadListResponse<Category>>("/categories", {
    page: 1,
    limit,
    sort: "name",
    depth: 0,
  });

  const docs = [...firstPage.docs];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await payloadFetch<PayloadListResponse<Category>>("/categories", {
      page,
      limit,
      sort: "name",
      depth: 0,
    });
    docs.push(...nextPage.docs);
  }

  return docs;
};

export const getAllTags = async (): Promise<Tag[]> => {
  const limit = 200;
  const firstPage = await payloadFetch<PayloadListResponse<Tag>>("/tags", {
    page: 1,
    limit,
    sort: "name",
    depth: 0,
  });

  const docs = [...firstPage.docs];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await payloadFetch<PayloadListResponse<Tag>>("/tags", {
      page,
      limit,
      sort: "name",
      depth: 0,
    });
    docs.push(...nextPage.docs);
  }

  return docs;
};

export const getAllSeriesWithPosts = async (): Promise<Array<{
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  postCount: number;
}>> => {
  const limit = 200;
  const firstPage = await payloadFetch<PayloadListResponse<Series>>("/series", {
    page: 1,
    limit,
    sort: "name",
    depth: 2,
  });

  const docs = [...firstPage.docs];

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const nextPage = await payloadFetch<PayloadListResponse<Series>>("/series", {
      page,
      limit,
      sort: "name",
      depth: 2,
    });
    docs.push(...nextPage.docs);
  }

  return docs
    .map((series) => {
      const postCount = (series.posts ?? []).filter(isPublishedPostRelation).length;

      return {
        id: series.id,
        name: series.name,
        slug: series.slug,
        description: series.description,
        postCount,
      };
    })
    .filter((series) => series.postCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const footerItemsFromSiteSettings = (siteSettings: SiteSetting): NonNullable<SiteSetting["sidebarFooterItems"]> => {
  return asSiteFooterItems(siteSettings.sidebarFooterItems);
};

export const getBlogPage = async (): Promise<BlogPage> => {
  return payloadFetch<BlogPage>("/globals/blog-page", { depth: 2 });
};

export const authorsFromPost = (post: Post): Array<PopulatedAuthor | User> => {
  const populatedAuthors = asPopulatedAuthors(post.populatedAuthors);
  if (populatedAuthors.length > 0) {
    return populatedAuthors;
  }

  return asUserArray(post.authors);
};
