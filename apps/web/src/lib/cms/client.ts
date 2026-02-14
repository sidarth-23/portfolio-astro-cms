import type {
  CmsCategory,
  CmsMedia,
  CmsPost,
  CmsProject,
  CmsTag,
  CvPageGlobal,
  HomePageGlobal,
  PayloadListResponse,
  ProjectsPageGlobal,
  SiteSettingsGlobal,
} from "@/lib/cms/types";
import { FALLBACK_POSTS } from "@/lib/cms/fallback";

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
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (READ_TOKEN) {
    headers.Authorization = `Bearer ${READ_TOKEN}`;
  }

  const response = await fetch(buildUrl(path, params), {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Payload fetch failed (${response.status}) for ${path}`);
  }

  return response.json() as Promise<T>;
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

export const getSiteSettings = async (): Promise<SiteSettingsGlobal | null> => {
  try {
    return await payloadFetch<SiteSettingsGlobal>("/globals/site-settings", { depth: 2 });
  } catch {
    return null;
  }
};

export const getHomePage = async (): Promise<HomePageGlobal | null> => {
  try {
    return await payloadFetch<HomePageGlobal>("/globals/home-page", { depth: 2 });
  } catch {
    return null;
  }
};

export const getCvPage = async (): Promise<CvPageGlobal | null> => {
  try {
    return await payloadFetch<CvPageGlobal>("/globals/cv-page", { depth: 2 });
  } catch {
    return null;
  }
};

export const getProjectsPage = async (): Promise<ProjectsPageGlobal | null> => {
  try {
    return await payloadFetch<ProjectsPageGlobal>("/globals/projects-page", { depth: 2 });
  } catch {
    return null;
  }
};

export const getAllPublishedPosts = async (): Promise<CmsPost[]> => {
  try {
    const res = await payloadFetch<PayloadListResponse<CmsPost>>("/posts", {
      depth: 2,
      limit: 200,
      sort: "-publishedAt",
    });

    return sortPosts(res.docs.filter(isPublished));
  } catch {
    return FALLBACK_POSTS;
  }
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
      const tagMatch = (post.tags || []).some((tag) => {
        return typeof tag === "object" && tag.slug === tagSlug;
      });
      if (!tagMatch) {
        return false;
      }
    }

    if (categorySlug) {
      const category = post.primaryCategory;
      if (!(category && typeof category === "object" && category.slug === categorySlug)) {
        return false;
      }
    }

    return true;
  });

  return paginate(filtered, page, pageSize);
};

export const getPostBySlug = async (slug: string): Promise<CmsPost | null> => {
  let post: CmsPost | undefined;

  try {
    const response = await payloadFetch<PayloadListResponse<CmsPost>>("/posts", {
      depth: 3,
      limit: 1,
      "where[slug][equals]": slug,
    });
    post = response.docs[0];
  } catch {
    post = FALLBACK_POSTS.find((item) => item.slug === slug);
  }

  if (!post || !isPublished(post)) {
    return null;
  }

  return post;
};

export const getTagSlugs = async (): Promise<string[]> => {
  const posts = await getAllPublishedPosts();
  const tags = posts.flatMap((post) => {
    return (post.tags || [])
      .map((tag) => {
        return typeof tag === "object" ? tag.slug : null;
      })
      .filter((value): value is string => typeof value === "string");
  });

  return [...new Set(tags)].sort((a, b) => a.localeCompare(b));
};

export const getCategorySlugs = async (): Promise<string[]> => {
  const posts = await getAllPublishedPosts();
  const categories = posts
    .map((post) => {
      const category = post.primaryCategory;
      return category && typeof category === "object" ? category.slug : null;
    })
    .filter((value): value is string => typeof value === "string");

  return [...new Set(categories)].sort((a, b) => a.localeCompare(b));
};

export const getProjects = async (): Promise<CmsProject[]> => {
  try {
    const res = await payloadFetch<PayloadListResponse<CmsProject>>("/projects", {
      depth: 2,
      limit: 200,
      sort: "displayOrder",
    });

    return res.docs
      .filter((project) => project.isVisible !== false)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch {
    return [];
  }
};

export const mediaToUrl = toAbsoluteMediaUrl;

export const categoryFromPost = (post: CmsPost): CmsCategory | undefined => {
  return post.primaryCategory && typeof post.primaryCategory === "object"
    ? post.primaryCategory
    : undefined;
};

export const tagsFromPost = (post: CmsPost): CmsTag[] => {
  return (post.tags || []).filter((tag): tag is CmsTag => typeof tag === "object");
};
