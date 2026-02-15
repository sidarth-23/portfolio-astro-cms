import { ASTRO_CMS_API_URL, ASTRO_CMS_READ_TOKEN } from "astro:env/server";

import {
  normalizeCvPage,
  normalizeHomePage,
  normalizePost,
  normalizeProject,
  normalizeProjectsPage,
  normalizeSiteSettings,
  type CmsCategory,
  type CmsMedia,
  type CmsPost,
  type CmsProject,
  type CmsTag,
  type CvPageGlobal,
  type HomePageGlobal,
  type PayloadListResponse,
  type ProjectsPageGlobal,
  type RawCvPage,
  type RawHomePage,
  type RawPost,
  type RawProject,
  type RawProjectsPage,
  type RawSiteSettings,
  type SiteSettingsGlobal,
} from "@sidshub/cms-types";

const API_BASE = ASTRO_CMS_API_URL.replace(/\/$/, "");
const READ_TOKEN = ASTRO_CMS_READ_TOKEN;

type Params = Record<string, string | number | boolean | undefined>;

type PostFilterOptions = {
  slug?: string;
  tagSlug?: string;
  categorySlug?: string;
};

type PublishedPostsQueryOptions = PostFilterOptions & {
  page?: number;
  pageSize?: number;
  limit?: number;
  depth?: number;
  sort?: string;
};

type PaginatedPosts = {
  docs: CmsPost[];
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

const toAbsoluteMediaUrl = (media: CmsMedia | string | null | undefined): string | undefined => {
  if (!media) {
    return undefined;
  }

  if (typeof media === "string") {
    return media;
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
  };

  if (READ_TOKEN) {
    headers.Authorization = `Bearer ${READ_TOKEN}`;
  }

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
  const nowIso = new Date().toISOString();
  const params: Params = {
    "where[status][equals]": "published",
    "where[publishedAt][less_than_equal]": nowIso,
  };

  if (options.slug) {
    params["where[slug][equals]"] = options.slug;
  }

  if (options.tagSlug) {
    params["where[tags.slug][equals]"] = options.tagSlug;
  }

  if (options.categorySlug) {
    params["where[primaryCategory.slug][equals]"] = options.categorySlug;
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
): Promise<PayloadListResponse<RawPost>> => {
  return payloadFetch<PayloadListResponse<RawPost>>("/posts", buildPublishedPostsQueryParams(options));
};

const sortPosts = (posts: CmsPost[]): CmsPost[] => {
  return posts.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
};

const fetchAllTaxonomySlugs = async (path: "/tags" | "/categories"): Promise<string[]> => {
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

const hasPublishedPosts = async (filters: Pick<PostFilterOptions, "tagSlug" | "categorySlug">): Promise<boolean> => {
  const result = await fetchPublishedPostsPage({
    ...filters,
    limit: 1,
    depth: 0,
  });

  return result.totalDocs > 0;
};

export const getSiteSettings = async (): Promise<SiteSettingsGlobal> => {
  const raw = await payloadFetch<RawSiteSettings>("/globals/site-settings", { depth: 2 });
  return normalizeSiteSettings(raw);
};

export const getHomePage = async (): Promise<HomePageGlobal> => {
  const raw = await payloadFetch<RawHomePage>("/globals/home-page", { depth: 2 });
  return normalizeHomePage(raw);
};

export const getCvPage = async (): Promise<CvPageGlobal> => {
  const raw = await payloadFetch<RawCvPage>("/globals/cv-page", { depth: 2 });
  return normalizeCvPage(raw);
};

export const getProjectsPage = async (): Promise<ProjectsPageGlobal> => {
  const raw = await payloadFetch<RawProjectsPage>("/globals/projects-page", { depth: 2 });
  return normalizeProjectsPage(raw);
};

export const getAllPublishedPosts = async (
  filters: Omit<PostFilterOptions, "slug"> = {},
): Promise<CmsPost[]> => {
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

  return sortPosts(rawPosts.map((post) => normalizePost(post)));
};

export const getPaginatedPublishedPosts = async ({
  page,
  pageSize,
  tagSlug,
  categorySlug,
}: {
  page: number;
  pageSize: number;
  tagSlug?: string;
  categorySlug?: string;
}): Promise<PaginatedPosts> => {
  const response = await fetchPublishedPostsPage({
    page,
    pageSize,
    tagSlug,
    categorySlug,
  });

  return {
    docs: response.docs.map((post) => normalizePost(post)),
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

export const getPostBySlug = async (slug: string): Promise<CmsPost | null> => {
  const response = await fetchPublishedPostsPage({
    slug,
    limit: 1,
  });
  const rawPost = response.docs[0];

  if (!rawPost) {
    return null;
  }

  return normalizePost(rawPost);
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

export const getProjects = async (): Promise<CmsProject[]> => {
  const res = await payloadFetch<PayloadListResponse<RawProject>>("/projects", {
    depth: 3,
    limit: 200,
    sort: "displayOrder",
    "where[isVisible][equals]": true,
  });

  return res.docs
    .map((project) => normalizeProject(project))
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

export const mediaToUrl = toAbsoluteMediaUrl;

export const categoryFromPost = (post: CmsPost): CmsCategory | undefined => {
  return post.primaryCategory;
};

export const tagsFromPost = (post: CmsPost): CmsTag[] => {
  return post.tags;
};
