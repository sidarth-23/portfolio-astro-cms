import type { PayloadSDK } from "@payloadcms/sdk";
import type { Where } from "payload";
import type {
  BlogPage,
  Category,
  Config,
  CvPage,
  HomePage,
  Post,
  Project,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
} from "@sidshub/cms-core/payload-types";
import type { CmsTransport } from "@sidshub/cms-core/client";
import type { PaginatedPosts, PostFilterOptions, PublishedPostsQueryOptions } from "./types";

type RelationID = number | string;

type TaxonomyDoc = {
  id: RelationID;
  slug?: string | null;
};

type SeriesLookupDoc = TaxonomyDoc & Pick<Series, "posts">;

const NO_MATCHING_POSTS_ID = "__no_matching_posts__";

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

const isPublishedPostRelation = (value: RelationID | Post | null | undefined): value is Post => {
  return typeof value === "object" && value !== null && value._status !== "draft";
};

const sortPosts = (posts: Post[]): Post[] => {
  return posts.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });
};

export function createCmsQueries(
  { sdk }: CmsTransport,
  getCachedGlobal: <T>(key: string, loader: () => Promise<T>) => Promise<T>,
) {
  const getTaxonomyDocBySlug = async <TDoc extends TaxonomyDoc>(
    collection: "categories" | "series",
    slug: string,
    depth = 0,
  ): Promise<TDoc | null> => {
    const response = await (sdk as PayloadSDK<Config>).find({
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
    return (sdk as PayloadSDK<Config>).find({
      collection: "posts",
      where: await buildPublishedWhere(options),
      depth: options.depth ?? 3,
      sort: options.sort ?? "-publishedAt",
      limit: options.limit ?? options.pageSize,
      page: options.page,
    });
  };

  const fetchPublishedProjects = async ({
    slug,
    depth = 2,
  }: { slug?: string; depth?: number } = {}) => {
    const conditions: Where[] = [{ _status: { equals: "published" } }];
    if (slug) {
      conditions.push({ slug: { equals: slug } });
    }
    return (sdk as PayloadSDK<Config>).find({
      collection: "projects",
      where: conditions.length === 1 ? conditions[0] : { and: conditions },
      depth,
      sort: "title",
      limit: slug ? 1 : 200,
    });
  };

  const fetchAllTaxonomySlugs = async (collection: "categories" | "series"): Promise<string[]> => {
    const limit = 200;
    const firstPage = await (sdk as PayloadSDK<Config>).find({
      collection: collection as "categories",
      page: 1,
      limit,
      sort: "slug",
      depth: 0,
    });

    const docs: TaxonomyDoc[] = [...firstPage.docs];

    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const nextPage = await (sdk as PayloadSDK<Config>).find({
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
    const result = await (sdk as PayloadSDK<Config>).count({
      collection: "posts",
      where: await buildPublishedWhere(filters),
    });
    return result.totalDocs > 0;
  };

  return {
    getSiteSettings: (): Promise<SiteSetting> => {
      return getCachedGlobal("global:site-settings", () =>
        (sdk as PayloadSDK<Config>).findGlobal({ slug: "site-settings", depth: 2 }),
      );
    },

    getHomePage: (): Promise<HomePage> => {
      return getCachedGlobal("global:home-page", () =>
        (sdk as PayloadSDK<Config>).findGlobal({ slug: "home-page", depth: 3 }),
      );
    },

    getCvPage: (): Promise<CvPage> => {
      return getCachedGlobal("global:cv-page", () =>
        (sdk as PayloadSDK<Config>).findGlobal({ slug: "cv-page", depth: 2 }),
      );
    },

    getProjectsPage: (): Promise<ProjectsPage> => {
      return getCachedGlobal("global:projects-page", () =>
        (sdk as PayloadSDK<Config>).findGlobal({ slug: "projects-page", depth: 2 }),
      );
    },

    getSeriesPage: (): Promise<SeriesPage> => {
      return getCachedGlobal("global:series-page", () =>
        (sdk as PayloadSDK<Config>).findGlobal({ slug: "series-page", depth: 2 }),
      );
    },

    getBlogPage: (): Promise<BlogPage> => {
      return getCachedGlobal("global:blog-page", () =>
        (sdk as PayloadSDK<Config>).findGlobal({ slug: "blog-page", depth: 2 }),
      );
    },

    getAllPublishedPosts: async (
      filters: Omit<PostFilterOptions, "slug"> = {},
    ): Promise<Post[]> => {
      const limit = 100;
      const firstPage = await fetchPublishedPostsPage({ ...filters, page: 1, pageSize: limit });
      const rawPosts = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await fetchPublishedPostsPage({ ...filters, page, pageSize: limit });
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
      const response = await fetchPublishedPostsPage({ slug, limit: 1 });
      return response.docs[0] ?? null;
    },

    getProjectBySlug: async (slug: string): Promise<Project | null> => {
      const response = await fetchPublishedProjects({ slug, depth: 3 });
      return response.docs[0] ?? null;
    },

    getCategorySlugs: async (): Promise<string[]> => {
      const allCategorySlugs = await fetchAllTaxonomySlugs("categories");
      const hasPostsByCategory = await Promise.all(
        allCategorySlugs.map(async (categorySlug) => ({
          categorySlug,
          hasPosts: await hasPublishedPosts({ categorySlug }),
        })),
      );
      return hasPostsByCategory
        .filter((item) => item.hasPosts)
        .map((item) => item.categorySlug)
        .sort((a, b) => a.localeCompare(b));
    },

    getSeriesSlugs: async (): Promise<string[]> => {
      const allSeriesSlugs = await fetchAllTaxonomySlugs("series");
      const hasPostsBySeries = await Promise.all(
        allSeriesSlugs.map(async (seriesSlug) => ({
          seriesSlug,
          hasPosts: await hasPublishedPosts({ seriesSlug }),
        })),
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
      const response = await (sdk as PayloadSDK<Config>).find({
        collection: "series",
        where: { slug: { equals: slug } },
        depth: 2,
        limit: 1,
      });
      return response.docs[0] ?? null;
    },

    getSeriesStaticPathsData: async (): Promise<
      Array<{ slug: string; series: Series; posts: Post[] }>
    > => {
      const limit = 200;
      const firstPage = await (sdk as PayloadSDK<Config>).find({
        collection: "series",
        page: 1,
        limit,
        sort: "slug",
        depth: 3,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await (sdk as PayloadSDK<Config>).find({
          collection: "series",
          page,
          limit,
          sort: "slug",
          depth: 3,
        });
        docs.push(...nextPage.docs);
      }

      return docs.flatMap((series) => {
        const slug = toTrimmedString(series.slug);
        if (!slug) return [];
        const posts = (series.posts ?? []).filter(isPublishedPostRelation);
        if (posts.length === 0) return [];
        return [{ slug, series, posts }];
      });
    },

    getAllCategories: async (): Promise<Category[]> => {
      const limit = 200;
      const firstPage = await (sdk as PayloadSDK<Config>).find({
        collection: "categories",
        page: 1,
        limit,
        sort: "name",
        depth: 0,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await (sdk as PayloadSDK<Config>).find({
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
      const firstPage = await (sdk as PayloadSDK<Config>).find({
        collection: "series",
        page: 1,
        limit,
        sort: "name",
        depth: 2,
      });

      const docs = [...firstPage.docs];

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await (sdk as PayloadSDK<Config>).find({
          collection: "series",
          page,
          limit,
          sort: "name",
          depth: 2,
        });
        docs.push(...nextPage.docs);
      }

      return docs
        .map((series) => ({
          id: series.id,
          name: series.name,
          slug: series.slug,
          description: series.description,
          postCount: (series.posts ?? []).filter(isPublishedPostRelation).length,
        }))
        .filter((series) => series.postCount > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  };
}
