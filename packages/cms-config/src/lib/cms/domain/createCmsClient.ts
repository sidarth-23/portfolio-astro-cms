import type {
  BlogPage,
  Category,
  CvPage,
  HomePage,
  Media,
  NotFoundPage,
  Post,
  Project,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
  Tag,
  User,
} from "../../../payload-types";
import { createSlug } from "../../createSlug";
import {
  asCategory,
  asPopulatedAuthors,
  asSeries,
  asSiteFooterItems,
  asTagArray,
  asUserArray,
} from "./guards";
import type {
  PaginatedPosts,
  Params,
  PayloadListResponse,
  PopulatedAuthor,
  PostFilterOptions,
  ProjectLink,
  PublishedPostsQueryOptions,
  SiteFooterItem,
} from "./types";

const PAGE_ROUTES: Record<string, string> = {
  home: "/",
  blog: "/blog",
  projects: "/projects",
  cv: "/cv",
};

type TaxonomyDoc = {
  slug?: string | null;
};

type CmsTransport = {
  fetch: <T>(path: string, params?: Params) => Promise<T>;
  mediaBaseUrl: string;
};

type HomeCtaVariant = NonNullable<NonNullable<HomePage["ctaButtons"]>[number]["variant"]>;
type HomeCtaButton = {
  title: string;
  href: string;
  variant: HomeCtaVariant;
  newTab: boolean;
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

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const createCmsClient = ({ fetch, mediaBaseUrl }: CmsTransport) => {
  const fetchPublishedPostsPage = async (
    options: PublishedPostsQueryOptions = {},
  ): Promise<PayloadListResponse<Post>> => {
    return fetch<PayloadListResponse<Post>>("/posts", buildPublishedPostsQueryParams(options));
  };

  const fetchAllTaxonomySlugs = async (path: "/tags" | "/categories" | "/series"): Promise<string[]> => {
    const limit = 200;
    const firstPage = await fetch<PayloadListResponse<TaxonomyDoc>>(path, {
      page: 1,
      limit,
      sort: "slug",
      depth: 0,
    });

    const docs = [...firstPage.docs];

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await fetch<PayloadListResponse<TaxonomyDoc>>(path, {
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

  const hasPublishedPosts = async (
    filters: Pick<PostFilterOptions, "tagSlug" | "categorySlug" | "seriesSlug">,
  ): Promise<boolean> => {
    const result = await fetchPublishedPostsPage({
      ...filters,
      limit: 1,
      depth: 0,
    });

    return result.totalDocs > 0;
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

    return media.url.startsWith("http") ? media.url : `${mediaBaseUrl}${media.url}`;
  };

  return {
    getSiteSettings: async (): Promise<SiteSetting> => {
      return fetch<SiteSetting>("/globals/site-settings", { depth: 2 });
    },

    getHomePage: async (): Promise<HomePage> => {
      return fetch<HomePage>("/globals/home-page", { depth: 2 });
    },

    getCvPage: async (): Promise<CvPage> => {
      return fetch<CvPage>("/globals/cv-page", { depth: 2 });
    },

    getProjectsPage: async (): Promise<ProjectsPage> => {
      return fetch<ProjectsPage>("/globals/projects-page", { depth: 2 });
    },

    getSeriesPage: async (): Promise<SeriesPage> => {
      return fetch<SeriesPage>("/globals/series-page", { depth: 2 });
    },

    getNotFoundPage: async (): Promise<NotFoundPage> => {
      return fetch<NotFoundPage>("/globals/not-found-page", { depth: 2 });
    },

    getBlogPage: async (): Promise<BlogPage> => {
      return fetch<BlogPage>("/globals/blog-page", { depth: 2 });
    },

    homeCtaButtons: (homePage: HomePage): HomeCtaButton[] => {
      const isPost = (value: number | Post): value is Post => {
        return typeof value === "object" && value !== null && value._status !== "draft";
      };

      const isProject = (value: number | Project | null | undefined): value is Project => {
        return typeof value === "object" && value !== null && value._status !== "draft";
      };

      // No _status check here: the Series collection does not have draft/publish
      // versioning, so the _status field does not exist on the Series type.
      const isSeries = (value: number | Series): value is Series => {
        return typeof value === "object" && value !== null;
      };

      const resolveHref = (button: NonNullable<HomePage["ctaButtons"]>[number]): string | undefined => {
        if (!button.link) {
          return undefined;
        }

        if (button.link.type === "custom") {
          return toTrimmedString(button.link.url);
        }

        if (button.link.type === "page") {
          const route = button.link.page ? PAGE_ROUTES[button.link.page] : undefined;
          return route;
        }

        const reference = button.link.reference;
        if (!reference || typeof reference === "number") {
          return undefined;
        }

        if (reference.relationTo === "posts" && isPost(reference.value) && reference.value.slug) {
          return `/blog/${reference.value.slug}`;
        }

        if (reference.relationTo === "projects" && isProject(reference.value) && reference.value.slug) {
          return `/projects/${reference.value.slug}`;
        }

        if (reference.relationTo === "series" && isSeries(reference.value) && reference.value.slug) {
          return `/blog/series/${reference.value.slug}`;
        }

        return undefined;
      };

      return (
        homePage.ctaButtons?.flatMap((button) => {
          const title = toTrimmedString(button.title);
          const href = resolveHref(button);

          if (!title || !href) {
            return [];
          }

          return [
            {
              title,
              href,
              variant: button.variant ?? "default",
              newTab: button.link?.newTab === true,
            },
          ];
        }) ?? []
      );
    },

    featuredPostsFromHomeSection: (section: NonNullable<HomePage["featuredSections"]>[number]): Post[] => {
      if (!Array.isArray(section.posts)) {
        return [];
      }

      return section.posts.filter(isPublishedPostRelation);
    },

    featuredProjectsFromHomeSection: (section: NonNullable<HomePage["featuredSections"]>[number]): Project[] => {
      if (!Array.isArray(section.projects)) {
        return [];
      }

      return section.projects.filter(
        (value): value is Project =>
          typeof value === "object" && value !== null && (value as Project)._status !== "draft",
      );
    },

    getAllPublishedPosts: async (filters: Omit<PostFilterOptions, "slug"> = {}): Promise<Post[]> => {
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
    },

    getPaginatedPublishedPosts: async ({
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
    },

    getPostBySlug: async (slug: string): Promise<Post | null> => {
      const response = await fetchPublishedPostsPage({
        slug,
        limit: 1,
      });
      const rawPost = response.docs[0];

      if (!rawPost) {
        return null;
      }

      return rawPost;
    },

    getTagSlugs: async (): Promise<string[]> => {
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
    },

    getCategorySlugs: async (): Promise<string[]> => {
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
    },

    getSeriesSlugs: async (): Promise<string[]> => {
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
    },

    getPostsBySeries: async (seriesSlug: string): Promise<Post[]> => {
      const response = await fetch<PayloadListResponse<Series>>("/series", {
        depth: 3,
        limit: 1,
        "where[slug][equals]": seriesSlug,
      });

      const series = response.docs[0];
      if (!series?.posts || series.posts.length === 0) {
        return [];
      }

      return series.posts.filter(isPublishedPostRelation);
    },

    getSeriesBySlug: async (slug: string): Promise<Series | null> => {
      const response = await fetch<PayloadListResponse<Series>>("/series", {
        depth: 2,
        limit: 1,
        "where[slug][equals]": slug,
      });

      return response.docs[0] ?? null;
    },

    getAllCategories: async (): Promise<Category[]> => {
      const limit = 200;
      const firstPage = await fetch<PayloadListResponse<Category>>("/categories", {
        page: 1,
        limit,
        sort: "name",
        depth: 0,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await fetch<PayloadListResponse<Category>>("/categories", {
          page,
          limit,
          sort: "name",
          depth: 0,
        });
        docs.push(...nextPage.docs);
      }

      return docs;
    },

    getAllTags: async (): Promise<Tag[]> => {
      const limit = 200;
      const firstPage = await fetch<PayloadListResponse<Tag>>("/tags", {
        page: 1,
        limit,
        sort: "name",
        depth: 0,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await fetch<PayloadListResponse<Tag>>("/tags", {
          page,
          limit,
          sort: "name",
          depth: 0,
        });
        docs.push(...nextPage.docs);
      }

      return docs;
    },

    getAllSeriesWithPosts: async (): Promise<
      Array<{
        id: number;
        name: string;
        slug: string;
        description?: string | null;
        postCount: number;
      }>
    > => {
      const limit = 200;
      const firstPage = await fetch<PayloadListResponse<Series>>("/series", {
        page: 1,
        limit,
        sort: "name",
        depth: 2,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await fetch<PayloadListResponse<Series>>("/series", {
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
    },

    mediaToUrl: toAbsoluteMediaUrl,

    categoryFromPost: (post: Post): { name: string; slug: string } | undefined => {
      const category = asCategory(post.primaryCategory);
      if (!category) {
        return undefined;
      }

      return {
        name: category.name,
        slug: category.slug,
      };
    },

    tagsFromPost: (post: Post): Array<{ name: string; slug: string }> => {
      return asTagArray(post.tags).map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      }));
    },

    seriesFromPost: (post: Post): { name: string; slug: string } | undefined => {
      const series = asSeries(post.series);
      if (!series) {
        return undefined;
      }

      return { name: series.name, slug: series.slug };
    },

    badgesFromProject: (project: Project): string[] => {
      if (!Array.isArray(project.badges)) {
        return [];
      }

      return project.badges.flatMap((badge) => {
        const value = toTrimmedString(badge?.value);
        return value ? [value] : [];
      });
    },

    tagsFromProject: (project: Project): Array<{ name: string; slug: string }> => {
      if (!Array.isArray(project.tags)) {
        return [];
      }

      return project.tags.flatMap((tag) => {
        const value = toTrimmedString(tag?.value);
        if (!value) {
          return [];
        }

        return [{ name: value, slug: createSlug(value) }];
      });
    },

    linksFromProject: (project: Project): ProjectLink[] => {
      if (!Array.isArray(project.links)) {
        return [];
      }

      const isPost = (value: number | Post): value is Post => {
        return typeof value === "object" && value !== null && value._status !== "draft";
      };

      const isProject = (value: number | Project | null | undefined): value is Project => {
        return typeof value === "object" && value !== null && (value as Project)._status !== "draft";
      };

      // No _status check here: the Series collection does not have draft/publish
      // versioning, so the _status field does not exist on the Series type.
      const isSeries = (value: number | Series | null | undefined): value is Series => {
        return typeof value === "object" && value !== null;
      };

      const resolveUrl = (link: NonNullable<Project["links"]>[number]): string | undefined => {
        const type = link.type ?? "custom";

        if (type === "custom") {
          return toTrimmedString(link.url as string | undefined);
        }

        if (type === "page") {
          const page = link.page as string | undefined;
          if (!page) return undefined;
          return PAGE_ROUTES[page];
        }

        if (type === "reference") {
          const reference = link.reference as
            | { relationTo: string; value: number | Post | Project | Series | null | undefined }
            | number
            | null
            | undefined;

          if (!reference || typeof reference === "number") {
            return undefined;
          }

          if (reference.relationTo === "posts" && isPost(reference.value as number | Post) && (reference.value as Post).slug) {
            return `/blog/${(reference.value as Post).slug}`;
          }

          if (reference.relationTo === "projects" && isProject(reference.value as number | Project) && (reference.value as Project).slug) {
            // Links to the project detail page (not the /projects#slug anchor used by homeCtaButtons).
            return `/projects/${(reference.value as Project).slug}`;
          }

          if (reference.relationTo === "series" && isSeries(reference.value as number | Series) && (reference.value as Series).slug) {
            return `/blog/series/${(reference.value as Series).slug}`;
          }

          return undefined;
        }

        return undefined;
      };

      return project.links.flatMap((link) => {
        const icon = toTrimmedString(link.icon as string | undefined);
        if (!icon) return [];

        const url = resolveUrl(link);
        if (!url) return [];

        return [{ icon, url, newTab: link.newTab === true }];
      });
    },

    footerItemsFromSiteSettings: (siteSettings: SiteSetting): SiteFooterItem[] => {
      return asSiteFooterItems(siteSettings.sidebarFooterItems);
    },

    authorsFromPost: (post: Post): Array<PopulatedAuthor | User> => {
      const populatedAuthors = asPopulatedAuthors(post.populatedAuthors);
      if (populatedAuthors.length > 0) {
        return populatedAuthors;
      }

      return asUserArray(post.authors);
    },
  };
};

export type CmsClient = ReturnType<typeof createCmsClient>;
