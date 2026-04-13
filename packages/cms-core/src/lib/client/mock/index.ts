import { faker } from "@faker-js/faker";
import { createCmsClient } from "../createCmsClient";
import {
  makeBlogPage,
  makeCategory,
  makeCvPage,
  makeHomePage,
  makeNotFoundPage,
  makePost,
  makeProject,
  makeProjectsPage,
  makeSeries,
  makeSeriesPage,
  makeSiteSetting,
} from "./factories";

const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split(".").reduce((curr: unknown, key: string) => {
    if (curr !== null && typeof curr === "object") {
      return (curr as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

const matchesCondition = (doc: unknown, where: unknown): boolean => {
  if (!where || typeof where !== "object") return true;

  const w = where as Record<string, unknown>;

  if (w.and) {
    return (w.and as unknown[]).every((c) => matchesCondition(doc, c));
  }
  if (w.or) {
    return (w.or as unknown[]).some((c) => matchesCondition(doc, c));
  }

  for (const [field, condition] of Object.entries(w)) {
    if (!condition || typeof condition !== "object") continue;
    const cond = condition as Record<string, unknown>;
    const value = getNestedValue(doc, field);

    if ("equals" in cond && value !== cond.equals) return false;
    if ("like" in cond) {
      const str = typeof value === "string" ? value.toLowerCase() : "";
      if (!str.includes(String(cond.like).toLowerCase())) return false;
    }
  }

  return true;
};

const paginate = <T>(docs: T[], page: number, limit: number) => {
  const totalDocs = docs.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return {
    docs: docs.slice(start, start + limit),
    totalDocs,
    totalPages,
    page: safePage,
    limit,
    hasPrevPage: safePage > 1,
    hasNextPage: safePage < totalPages,
    prevPage: safePage > 1 ? safePage - 1 : null,
    nextPage: safePage < totalPages ? safePage + 1 : null,
  };
};

export const createCmsMockClient = () => {
  faker.seed(42);

  const cat1 = makeCategory({ id: 1, name: "Technology", slug: "technology" });
  const cat2 = makeCategory({ id: 2, name: "Engineering", slug: "engineering" });
  const categories = [cat1, cat2];

  const post1 = makePost(cat1, { id: 10, title: "Getting Started with TypeScript", slug: "getting-started-typescript" });
  const post2 = makePost(cat2, { id: 11, title: "Building Better APIs", slug: "building-better-apis" });
  const post3 = makePost(cat1, { id: 12, title: "Series Part One: Introduction", slug: "series-part-one" });
  const post4 = makePost(cat1, { id: 13, title: "Series Part Two: Advanced Topics", slug: "series-part-two" });
  const post5 = makePost(cat2, { id: 14, title: "DevOps Fundamentals", slug: "devops-fundamentals" });
  const posts = [post1, post2, post3, post4, post5];

  const series1 = makeSeries([post3, post4], {
    id: 20,
    name: "TypeScript Deep Dive",
    slug: "typescript-deep-dive",
  });
  const seriesList = [series1];

  const project1 = makeProject({ id: 30, title: "Portfolio Website", slug: "portfolio-website" });
  const project2 = makeProject({ id: 31, title: "CMS Platform", slug: "cms-platform" });
  const projects = [project1, project2];

  const globals: Record<string, unknown> = {
    "site-settings": makeSiteSetting(),
    "home-page": makeHomePage(posts),
    "blog-page": makeBlogPage(),
    "cv-page": makeCvPage(),
    "projects-page": makeProjectsPage(projects),
    "series-page": makeSeriesPage(),
    "not-found-page": makeNotFoundPage(),
  };

  const collections: Record<string, unknown[]> = {
    posts,
    categories,
    series: seriesList,
  };

  const fakeSdk = {
    find: async ({ collection, where, limit, page }: Record<string, unknown>) => {
      const allDocs = collections[collection as string] ?? [];
      const filtered = allDocs.filter((doc) => matchesCondition(doc, where));
      return paginate(filtered, (page as number) ?? 1, (limit as number) ?? 100);
    },
    count: async ({ collection, where }: Record<string, unknown>) => {
      const allDocs = collections[collection as string] ?? [];
      const filtered = allDocs.filter((doc) => matchesCondition(doc, where));
      return { totalDocs: filtered.length };
    },
    findGlobal: async ({ slug }: Record<string, unknown>) => {
      const global = globals[slug as string];
      if (!global) throw new Error(`Mock: global not found: ${String(slug)}`);
      return global;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createCmsClient({ sdk: fakeSdk as any, mediaBaseUrl: "http://mock" });
};
