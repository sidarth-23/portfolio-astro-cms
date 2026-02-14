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

const API_BASE = (import.meta.env.ASTRO_CMS_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
const READ_TOKEN = import.meta.env.ASTRO_CMS_READ_TOKEN;

type Params = Record<string, string | number | boolean | undefined>;

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
    throw new Error(
      `Payload fetch failed for ${path} (${url}): invalid JSON response (${reason}).${details}`,
    );
  }
};

const isPublished = (post: CmsPost): boolean => {
  if (post.status && post.status !== "published") {
    return false;
  }

  if (!post.publishedAt) {
    return false;
  }

  return new Date(post.publishedAt).getTime() <= Date.now();
};

const sortPosts = (posts: CmsPost[]): CmsPost[] => {
  return posts.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
};

const paginate = (items: CmsPost[], page: number, pageSize: number): PaginatedPosts => {
  const totalDocs = items.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const docs = items.slice(start, start + pageSize);

  return {
    docs,
    page: safePage,
    pageSize,
    totalDocs,
    totalPages,
    hasPrevPage: safePage > 1,
    hasNextPage: safePage < totalPages,
    prevPage: safePage > 1 ? safePage - 1 : null,
    nextPage: safePage < totalPages ? safePage + 1 : null,
  };
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

export const getAllPublishedPosts = async (): Promise<CmsPost[]> => {
  const res = await payloadFetch<PayloadListResponse<RawPost>>("/posts", {
    depth: 3,
    limit: 200,
    sort: "-publishedAt",
  });

  return sortPosts(res.docs.map((post) => normalizePost(post)).filter(isPublished));
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
  const all = await getAllPublishedPosts();

  const filtered = all.filter((post) => {
    if (tagSlug) {
      const tagMatch = post.tags.some((tag) => tag.slug === tagSlug);
      if (!tagMatch) {
        return false;
      }
    }

    if (categorySlug) {
      const category = post.primaryCategory;
      if (!(category && category.slug === categorySlug)) {
        return false;
      }
    }

    return true;
  });

  return paginate(filtered, page, pageSize);
};

export const getPostBySlug = async (slug: string): Promise<CmsPost | null> => {
  const response = await payloadFetch<PayloadListResponse<RawPost>>("/posts", {
    depth: 3,
    limit: 1,
    "where[slug][equals]": slug,
  });
  const rawPost = response.docs[0];

  if (!rawPost) {
    return null;
  }

  const post = normalizePost(rawPost);

  if (!isPublished(post)) {
    return null;
  }

  return post;
};

export const getTagSlugs = async (): Promise<string[]> => {
  const posts = await getAllPublishedPosts();
  const tags = posts.flatMap((post) => post.tags.map((tag) => tag.slug));

  return [...new Set(tags)].sort((a, b) => a.localeCompare(b));
};

export const getCategorySlugs = async (): Promise<string[]> => {
  const posts = await getAllPublishedPosts();
  const categories = posts
    .map((post) => post.primaryCategory?.slug)
    .filter((value): value is string => typeof value === "string");

  return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
};

export const getProjects = async (): Promise<CmsProject[]> => {
  const res = await payloadFetch<PayloadListResponse<RawProject>>("/projects", {
    depth: 3,
    limit: 200,
    sort: "displayOrder",
  });

  return res.docs
    .map((project) => normalizeProject(project))
    .filter((project) => project.isVisible !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

export const mediaToUrl = toAbsoluteMediaUrl;

export const categoryFromPost = (post: CmsPost): CmsCategory | undefined => {
  return post.primaryCategory;
};

export const tagsFromPost = (post: CmsPost): CmsTag[] => {
  return post.tags;
};
