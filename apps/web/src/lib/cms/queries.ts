import type { CollectionSlug, Payload, Where } from "payload";
import type {
  BlogPage,
  Category,
  CvPage,
  HomePage,
  Post,
  Project,
  ProjectsPage,
  Series,
  SeriesPage,
  SiteSetting,
} from "@sidshub/cms/payload-types";
import { cmsCache, cmsSearchCacheTtl, type CmsCache } from "./cache";
import { isRelationID, type RelationID } from "./relations";
import type { PaginatedPosts, PostFilterOptions, PublishedPostsQueryOptions } from "./types";

export type CmsQueryOperations = Pick<Payload, "find" | "findGlobal" | "count">;

type TaxonomyDoc = { id: RelationID; slug?: string | null };
type SeriesLookupDoc = TaxonomyDoc & Pick<Series, "posts">;
const NO_MATCHING_POSTS_ID = "__no_matching_posts__";

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const relationIds = (
  values: Array<RelationID | { id?: unknown }> | null | undefined,
): RelationID[] =>
  (values ?? [])
    .map((value) => (isRelationID(value) ? value : value.id))
    .filter((id): id is RelationID => isRelationID(id));

export function createCmsQueries(query: CmsQueryOperations, cache: CmsCache = cmsCache) {
  const getTaxonomyDocBySlug = async <TDoc extends TaxonomyDoc>(
    collection: "categories" | "series",
    slug: string,
    depth = 0,
  ): Promise<TDoc | null> => {
    const response = await query.find({
      collection: collection as CollectionSlug,
      where: { slug: { equals: slug } },
      depth,
      limit: 1,
    });
    return (response.docs[0] as unknown as TDoc | undefined) ?? null;
  };

  const buildPublishedWhere = async (options: PostFilterOptions = {}): Promise<Where> => {
    const conditions: Where[] = [{ _status: { equals: "published" } }];
    if (options.slug) conditions.push({ slug: { equals: options.slug } });
    if (options.categorySlug) {
      const category = await getTaxonomyDocBySlug<TaxonomyDoc>("categories", options.categorySlug);
      conditions.push(
        category
          ? { primaryCategory: { equals: category.id } }
          : { id: { equals: NO_MATCHING_POSTS_ID } },
      );
    }
    if (options.seriesSlug) {
      const series = await getTaxonomyDocBySlug<SeriesLookupDoc>("series", options.seriesSlug);
      const postIds = relationIds(
        series?.posts as Array<RelationID | { id?: unknown }> | null | undefined,
      );
      conditions.push(
        postIds.length > 0 ? { id: { in: postIds } } : { id: { equals: NO_MATCHING_POSTS_ID } },
      );
    }
    const search = toTrimmedString(options.search);
    if (search)
      conditions.push({ or: [{ title: { like: search } }, { description: { like: search } }] });
    return conditions.length === 1 ? conditions[0] : { and: conditions };
  };

  const fetchPublishedPostsPage = async (options: PublishedPostsQueryOptions = {}) =>
    query.find({
      collection: "posts",
      where: await buildPublishedWhere(options),
      depth: options.depth ?? 2,
      sort: options.sort ?? "-publishedAt",
      limit: options.limit ?? options.pageSize,
      page: options.page,
    });

  const fetchPublishedProjects = ({ slug, depth = 2 }: { slug?: string; depth?: number } = {}) =>
    query.find({
      collection: "projects",
      where: slug
        ? { and: [{ _status: { equals: "published" } }, { slug: { equals: slug } }] }
        : { _status: { equals: "published" } },
      depth,
      sort: "title",
      limit: slug ? 1 : 200,
    });

  const fetchAll = async <T>(
    loader: (page: number) => Promise<{ docs: T[]; totalPages: number }>,
  ) => {
    const firstPage = await loader(1);
    const docs = [...firstPage.docs];
    for (let page = 2; page <= firstPage.totalPages; page += 1)
      docs.push(...(await loader(page)).docs);
    return docs;
  };

  return {
    getSiteSettings: (): Promise<SiteSetting> =>
      cache.getOrSet("global:site-settings", () =>
        query.findGlobal({ slug: "site-settings", depth: 2 }),
      ),
    getHomePage: (): Promise<HomePage> =>
      cache.getOrSet("global:home-page", () => query.findGlobal({ slug: "home-page", depth: 3 })),
    getCvPage: (): Promise<CvPage> =>
      cache.getOrSet("global:cv-page", () => query.findGlobal({ slug: "cv-page", depth: 2 })),
    getProjectsPage: (): Promise<ProjectsPage> =>
      cache.getOrSet("global:projects-page", () =>
        query.findGlobal({ slug: "projects-page", depth: 2 }),
      ),
    getSeriesPage: (): Promise<SeriesPage> =>
      cache.getOrSet("global:series-page", () =>
        query.findGlobal({ slug: "series-page", depth: 2 }),
      ),
    getBlogPage: (): Promise<BlogPage> =>
      cache.getOrSet("global:blog-page", () => query.findGlobal({ slug: "blog-page", depth: 2 })),

    getPublishedPostsCount: async (filters: PostFilterOptions = {}): Promise<number> =>
      (await query.count({ collection: "posts", where: await buildPublishedWhere(filters) }))
        .totalDocs,

    getAllPublishedPosts: async (filters: Omit<PostFilterOptions, "slug"> = {}): Promise<Post[]> =>
      fetchAll<Post>(
        (page) =>
          fetchPublishedPostsPage({ ...filters, page, pageSize: 100 }) as Promise<{
            docs: Post[];
            totalPages: number;
          }>,
      ),

    getPaginatedPublishedPosts: (options: {
      page: number;
      pageSize: number;
      categorySlug?: string;
      seriesSlug?: string;
      search?: string;
    }): Promise<PaginatedPosts> =>
      cache.getOrSet(
        `search:${JSON.stringify(options)}`,
        async () => {
          const response = await fetchPublishedPostsPage(options);
          return {
            docs: response.docs as Post[],
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
        cmsSearchCacheTtl,
      ),

    getPostBySlug: async (slug: string): Promise<Post | null> =>
      ((await fetchPublishedPostsPage({ slug, limit: 1 })).docs[0] as Post | undefined) ?? null,
    getProjectBySlug: async (slug: string): Promise<Project | null> =>
      ((await fetchPublishedProjects({ slug, depth: 3 })).docs[0] as Project | undefined) ?? null,
    getAllPublishedProjects: async (): Promise<Project[]> =>
      (await fetchPublishedProjects({ depth: 3 })).docs as Project[],

    getPostsBySeries: async (seriesSlug: string): Promise<Post[]> => {
      const series = await getTaxonomyDocBySlug<SeriesLookupDoc>("series", seriesSlug, 0);
      const postIds = relationIds(
        series?.posts as Array<RelationID | { id?: unknown }> | null | undefined,
      );
      if (postIds.length === 0) return [];
      const response = await query.find({
        collection: "posts",
        where: { id: { in: postIds }, _status: { equals: "published" } },
        depth: 2,
        limit: postIds.length,
      });
      const postsById = new Map((response.docs as Post[]).map((post) => [String(post.id), post]));
      return postIds.flatMap((id) => {
        const post = postsById.get(String(id));
        return post ? [post] : [];
      });
    },

    getSeriesBySlug: async (slug: string): Promise<Series | null> =>
      ((
        await query.find({
          collection: "series",
          where: { slug: { equals: slug } },
          depth: 2,
          limit: 1,
        })
      ).docs[0] as Series | undefined) ?? null,

    getSeriesStaticPathsData: async (): Promise<
      Array<{ slug: string; series: Series; posts: Post[] }>
    > => {
      const seriesDocs = await fetchAll<Series>(
        (page) =>
          query.find({
            collection: "series",
            page,
            limit: 200,
            sort: "slug",
            depth: 0,
          }) as Promise<{ docs: Series[]; totalPages: number }>,
      );
      return Promise.all(
        seriesDocs.map(async (series) => {
          const slug = toTrimmedString(series.slug);
          const postIds = relationIds(
            series.posts as Array<RelationID | { id?: unknown }> | null | undefined,
          );
          if (!slug || postIds.length === 0) return null;
          const response = await query.find({
            collection: "posts",
            where: { id: { in: postIds }, _status: { equals: "published" } },
            depth: 2,
            limit: postIds.length,
          });
          const postsById = new Map(
            (response.docs as Post[]).map((post) => [String(post.id), post]),
          );
          const posts = postIds.flatMap((id) => {
            const post = postsById.get(String(id));
            return post ? [post] : [];
          });
          return posts.length > 0 ? { slug, series, posts } : null;
        }),
      ).then((entries) => entries.flatMap((entry) => (entry ? [entry] : [])));
    },

    getAllCategories: (): Promise<Category[]> =>
      cache.getOrSet("taxonomy:categories", async () =>
        fetchAll<Category>(
          (page) =>
            query.find({
              collection: "categories",
              page,
              limit: 200,
              sort: "name",
              depth: 0,
            }) as Promise<{ docs: Category[]; totalPages: number }>,
        ),
      ),

    getAllSeriesWithPosts: () =>
      cache.getOrSet("taxonomy:series", async () => {
        const seriesDocs = await fetchAll<Series>(
          (page) =>
            query.find({
              collection: "series",
              page,
              limit: 200,
              sort: "name",
              depth: 0,
            }) as Promise<{ docs: Series[]; totalPages: number }>,
        );
        const published = await query.find({
          collection: "posts",
          where: { _status: { equals: "published" } },
          limit: 1000,
        });
        const publishedIds = new Set(
          (published.docs as Array<{ id: RelationID }>).map((post) => String(post.id)),
        );
        return seriesDocs
          .map((series) => {
            const postCount = relationIds(
              series.posts as Array<RelationID | { id?: unknown }> | null | undefined,
            ).filter((id) => publishedIds.has(String(id))).length;
            return {
              id: series.id,
              name: series.name,
              slug: series.slug,
              description: series.description,
              postCount,
            };
          })
          .filter((series) => series.postCount > 0);
      }),
  };
}
