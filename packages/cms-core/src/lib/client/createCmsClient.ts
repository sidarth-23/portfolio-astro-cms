import type { PayloadSDK } from "@payloadcms/sdk";
import type { Where } from "payload";
import type {
  BlogPage,
  Category,
  Config,
  CvPage,
  HomePage,
  Media,
  Post,
  Project,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
  User,
} from "@/payload-types";
import { createSlug } from "@/lib/content";
import { asCategory, asPopulatedAuthors, asSeries, asUserArray } from "./guards";
import type {
  PaginatedPosts,
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
  rss: "/rss.xml",
};

type TaxonomyDoc = {
  id: RelationID;
  slug?: string | null;
};

type SeriesLookupDoc = TaxonomyDoc & Pick<Series, "posts">;

type CmsTransport = {
  sdk: PayloadSDK<Config>;
  mediaBaseUrl: string;
  siteUrl?: string;
};

type HomeCtaVariant = NonNullable<NonNullable<HomePage["ctaButtons"]>[number]["variant"]>;
export type HomeCtaButton = {
  title: string;
  href: string;
  variant: HomeCtaVariant;
  newTab: boolean;
};

type RelationID = number | string;

const NO_MATCHING_POSTS_ID = "__no_matching_posts__";

const sortPosts = (posts: Post[]): Post[] => {
  return posts.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
};

const isPublishedPostRelation = (value: RelationID | Post | null | undefined): value is Post => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const isRelationID = (value: unknown): value is RelationID => {
  return typeof value === "number" || typeof value === "string";
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

type LinkReference =
  | { relationTo: string; value: RelationID | Post | Project | Series | null | undefined }
  | RelationID
  | null
  | undefined;

type LinkShape = {
  type?: string | null;
  url?: string | null;
  page?: string | null;
  reference?: LinkReference;
};

export const createCmsClient = ({ sdk, mediaBaseUrl, siteUrl }: CmsTransport) => {
  const getTaxonomyDocBySlug = async <TDoc extends TaxonomyDoc>(
    collection: "categories" | "series",
    slug: string,
    depth = 0,
  ): Promise<TDoc | null> => {
    const response = await sdk.find({
      collection: collection as "categories",
      where: { slug: { equals: slug } },
      depth,
      limit: 1,
    });

    return (response.docs[0] as unknown as TDoc | undefined) ?? null;
  };

  const getSeriesPostIds = async (seriesSlug: string): Promise<RelationID[]> => {
    const series = await getTaxonomyDocBySlug<SeriesLookupDoc>("series", seriesSlug, 1);
    if (!series) {
      return [];
    }

    return ((series.posts as Array<RelationID | { id?: unknown }> | null | undefined) ?? [])
      .map((post) => (isRelationID(post) ? post : post.id))
      .filter((id): id is RelationID => isRelationID(id));
  };

  const buildPublishedWhere = async (options: PostFilterOptions = {}): Promise<Where> => {
    const conditions: Where[] = [{ _status: { equals: "published" } }];
    if (options.slug) {
      conditions.push({ slug: { equals: options.slug } });
    }

    if (options.categorySlug) {
      const category = await getTaxonomyDocBySlug<TaxonomyDoc>("categories", options.categorySlug);
      conditions.push(
        category
          ? { primaryCategory: { equals: category.id } }
          : { id: { equals: NO_MATCHING_POSTS_ID } },
      );
    }

    if (options.seriesSlug) {
      const postIds = await getSeriesPostIds(options.seriesSlug);
      conditions.push(
        postIds.length > 0 ? { id: { in: postIds } } : { id: { equals: NO_MATCHING_POSTS_ID } },
      );
    }

    const search = toTrimmedString(options.search);
    if (search) {
      conditions.push({ or: [{ title: { like: search } }, { description: { like: search } }] });
    }

    return conditions.length === 1 ? conditions[0] : { and: conditions };
  };

  const fetchPublishedPostsPage = async (options: PublishedPostsQueryOptions = {}) => {
    return sdk.find({
      collection: "posts",
      where: await buildPublishedWhere(options),
      depth: options.depth ?? 3,
      sort: options.sort ?? "-publishedAt",
      limit: options.limit ?? options.pageSize,
      page: options.page,
    });
  };

  const fetchAllTaxonomySlugs = async (collection: "categories" | "series"): Promise<string[]> => {
    const limit = 200;
    const firstPage = await sdk.find({
      collection: collection as "categories",
      page: 1,
      limit,
      sort: "slug",
      depth: 0,
    });

    const docs: TaxonomyDoc[] = [...firstPage.docs];

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await sdk.find({
        collection: collection as "categories",
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
    filters: Pick<PostFilterOptions, "categorySlug" | "seriesSlug">,
  ): Promise<boolean> => {
    const result = await sdk.count({
      collection: "posts",
      where: await buildPublishedWhere(filters),
    });

    return result.totalDocs > 0;
  };

  const toAbsoluteMediaUrl = (
    media: Media | string | number | null | undefined,
  ): string | undefined => {
    if (!media) {
      return undefined;
    }

    if (typeof media === "string") {
      if (media.startsWith("http") || media.startsWith("/")) {
        return media;
      }

      return undefined;
    }

    if (isRelationID(media)) {
      return undefined;
    }

    if (!media.url) {
      return undefined;
    }

    return media.url.startsWith("http") ? media.url : `${mediaBaseUrl}${media.url}`;
  };

  const toAbsolutePageUrl = (route: string): string => {
    if (!siteUrl) {
      return route;
    }

    try {
      return new URL(route, siteUrl).toString();
    } catch {
      return route;
    }
  };

  const isPost = (value: RelationID | Post | null | undefined): value is Post => {
    return typeof value === "object" && value !== null && value._status !== "draft";
  };

  const isProject = (value: RelationID | Project | null | undefined): value is Project => {
    return typeof value === "object" && value !== null && value._status !== "draft";
  };

  const isSeries = (value: RelationID | Series | null | undefined): value is Series => {
    return typeof value === "object" && value !== null;
  };

  const resolveReferenceUrl = (reference: LinkReference): string | undefined => {
    if (!reference || isRelationID(reference)) {
      return undefined;
    }

    const referenceValue = reference.value;
    const postValue = referenceValue as RelationID | Post | null | undefined;
    const projectValue = referenceValue as RelationID | Project | null | undefined;
    const seriesValue = referenceValue as RelationID | Series | null | undefined;

    if (reference.relationTo === "posts" && isPost(postValue) && postValue.slug) {
      return `/blog/${postValue.slug}`;
    }

    if (reference.relationTo === "projects" && isProject(projectValue) && projectValue.slug) {
      return `/projects/${projectValue.slug}`;
    }

    if (reference.relationTo === "series" && isSeries(seriesValue) && seriesValue.slug) {
      return `/blog/series/${seriesValue.slug}`;
    }

    return undefined;
  };

  const resolveLinkUrl = (link: LinkShape | null | undefined): string | undefined => {
    if (!link) {
      return undefined;
    }

    const type = link.type ?? "custom";

    if (type === "custom") {
      return toTrimmedString(link.url);
    }

    if (type === "page") {
      const page = toTrimmedString(link.page);
      if (!page) {
        return undefined;
      }

      const route = PAGE_ROUTES[page];
      return route ? toAbsolutePageUrl(route) : undefined;
    }

    if (type === "reference") {
      return resolveReferenceUrl(link.reference);
    }

    return undefined;
  };

  return {
    getSiteSettings: async (): Promise<SiteSetting> => {
      return sdk.findGlobal({ slug: "site-settings", depth: 2 });
    },

    getHomePage: async (): Promise<HomePage> => {
      return sdk.findGlobal({ slug: "home-page", depth: 3 });
    },

    getCvPage: async (): Promise<CvPage> => {
      return sdk.findGlobal({ slug: "cv-page", depth: 2 });
    },

    getProjectsPage: async (): Promise<ProjectsPage> => {
      return sdk.findGlobal({ slug: "projects-page", depth: 2 });
    },

    getSeriesPage: async (): Promise<SeriesPage> => {
      return sdk.findGlobal({ slug: "series-page", depth: 2 });
    },

    getBlogPage: async (): Promise<BlogPage> => {
      return sdk.findGlobal({ slug: "blog-page", depth: 2 });
    },

    homeCtaButtons: (homePage: HomePage): HomeCtaButton[] => {
      return (
        homePage.ctaButtons?.flatMap((button) => {
          const title = toTrimmedString(button.title);
          const href = resolveLinkUrl(button.link);

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

    featuredPostsFromHomeSection: (
      section: NonNullable<HomePage["featuredSections"]>[number],
    ): Post[] => {
      if (!Array.isArray(section.posts)) {
        return [];
      }

      return section.posts.filter(isPublishedPostRelation);
    },

    featuredProjectsFromHomeSection: (
      section: NonNullable<HomePage["featuredSections"]>[number],
    ): Project[] => {
      if (!Array.isArray(section.projects)) {
        return [];
      }

      return section.projects.filter(
        (value): value is Project =>
          typeof value === "object" && value !== null && (value as Project)._status !== "draft",
      );
    },

    getAllPublishedPosts: async (
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
    },

    getPaginatedPublishedPosts: async ({
      page,
      pageSize,
      categorySlug,
      seriesSlug,
      search,
    }: {
      page: number;
      pageSize: number;
      categorySlug?: string;
      seriesSlug?: string;
      search?: string;
    }): Promise<PaginatedPosts> => {
      const response = await fetchPublishedPostsPage({
        page,
        pageSize,
        categorySlug,
        seriesSlug,
        search,
      });

      return {
        docs: response.docs,
        page: response.page ?? 1,
        pageSize: response.limit,
        totalDocs: response.totalDocs,
        totalPages: response.totalPages,
        hasPrevPage: response.hasPrevPage,
        hasNextPage: response.hasNextPage,
        prevPage: response.prevPage ?? null,
        nextPage: response.nextPage ?? null,
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

    getCategorySlugs: async (): Promise<string[]> => {
      const allCategorySlugs = await fetchAllTaxonomySlugs("categories");
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
      const allSeriesSlugs = await fetchAllTaxonomySlugs("series");
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
      const series = await getTaxonomyDocBySlug<SeriesLookupDoc>("series", seriesSlug, 3);
      if (!series?.posts || series.posts.length === 0) {
        return [];
      }

      return series.posts.filter(isPublishedPostRelation);
    },

    getSeriesBySlug: async (slug: string): Promise<Series | null> => {
      const response = await sdk.find({
        collection: "series",
        where: { slug: { equals: slug } },
        depth: 2,
        limit: 1,
      });

      return response.docs[0] ?? null;
    },

    getAllCategories: async (): Promise<Category[]> => {
      const limit = 200;
      const firstPage = await sdk.find({
        collection: "categories",
        page: 1,
        limit,
        sort: "name",
        depth: 0,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await sdk.find({
          collection: "categories",
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
        id: RelationID;
        name: string;
        slug: string;
        description?: string | null;
        postCount: number;
      }>
    > => {
      const limit = 200;
      const firstPage = await sdk.find({
        collection: "series",
        page: 1,
        limit,
        sort: "name",
        depth: 2,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await sdk.find({
          collection: "series",
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
      if (!Array.isArray(post.tags)) {
        return [];
      }

      return post.tags.flatMap((tag) => {
        const value = toTrimmedString(tag?.value);
        if (!value) {
          return [];
        }

        return [{ name: value, slug: createSlug(value) }];
      });
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

      return project.links.flatMap((link) => {
        const icon = toTrimmedString(link.icon as string | undefined);
        if (!icon) return [];

        const url = resolveLinkUrl(link);
        if (!url) return [];

        return [{ icon, url, newTab: link.newTab === true }];
      });
    },

    footerItemsFromSiteSettings: (siteSettings: SiteSetting): SiteFooterItem[] => {
      if (!Array.isArray(siteSettings.sidebarFooterItems)) {
        return [];
      }

      return siteSettings.sidebarFooterItems.flatMap((item) => {
        const icon = toTrimmedString(item?.icon);
        if (!icon) {
          return [];
        }

        const url = resolveLinkUrl(item);
        if (!url) {
          return [];
        }

        return [{ icon, url, newTab: item?.newTab === true }];
      });
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
