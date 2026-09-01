import { faker } from "@faker-js/faker";
import type { Payload } from "payload";
import type { CmsQueryOperations } from "../queries";
import {
  makeBlogPage,
  makeCategory,
  makeCvPage,
  makeHomePage,
  makePost,
  makeProject,
  makeProjectsPage,
  makeSeries,
  makeSeriesPage,
  makeSiteSetting,
  nextId,
} from "./factories";

type FindOptions = Parameters<Payload["find"]>[0];
type FindResult = Awaited<ReturnType<Payload["find"]>>;
type CountOptions = Parameters<Payload["count"]>[0];
type CountResult = Awaited<ReturnType<Payload["count"]>>;
type FindGlobalOptions = Parameters<Payload["findGlobal"]>[0];
type FindGlobalResult = Awaited<ReturnType<Payload["findGlobal"]>>;

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
    if ("in" in cond && Array.isArray(cond.in) && !(cond.in as unknown[]).includes(value)) {
      return false;
    }
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

export const createMockTransport = (): CmsQueryOperations => {
  faker.seed(42);

  const cat1 = makeCategory({ id: nextId(), name: "Technology", slug: "technology" });
  const cat2 = makeCategory({ id: nextId(), name: "Engineering", slug: "engineering" });
  const categories = [cat1, cat2];

  const post1 = makePost(cat1, {
    id: nextId(),
    title: "Getting Started with TypeScript",
    slug: "getting-started-typescript",
  });
  const post2 = makePost(cat2, {
    id: nextId(),
    title: "Building Better APIs",
    slug: "building-better-apis",
  });
  const post3 = makePost(cat1, {
    id: nextId(),
    title: "Series Part One: Introduction",
    slug: "series-part-one",
  });
  const post4 = makePost(cat1, {
    id: nextId(),
    title: "Series Part Two: Advanced Topics",
    slug: "series-part-two",
  });
  const post5 = makePost(cat2, {
    id: nextId(),
    title: "DevOps Fundamentals",
    slug: "devops-fundamentals",
  });
  const posts = [post1, post2, post3, post4, post5];

  const series1 = makeSeries([post3, post4], {
    id: nextId(),
    name: "TypeScript Deep Dive",
    slug: "typescript-deep-dive",
  });
  const seriesList = [series1];

  const project1 = makeProject({
    id: nextId(),
    title: "Portfolio Website",
    slug: "portfolio-website",
  });
  const project2 = makeProject({ id: nextId(), title: "CMS Platform", slug: "cms-platform" });
  const projects = [project1, project2];

  const globals: Record<string, unknown> = {
    "site-settings": makeSiteSetting(),
    "home-page": makeHomePage(posts),
    "blog-page": makeBlogPage(),
    "cv-page": makeCvPage(),
    "projects-page": makeProjectsPage(projects),
    "series-page": makeSeriesPage(),
  };

  const collections: Record<string, unknown[]> = {
    posts,
    projects,
    categories,
    series: seriesList,
  };

  const fakePayload = {
    find: async (options: FindOptions) => {
      const allDocs = collections[String(options.collection)] ?? [];
      const filtered = allDocs.filter((doc) => matchesCondition(doc, options.where));
      return paginate(
        filtered,
        typeof options.page === "number" ? options.page : 1,
        typeof options.limit === "number" ? options.limit : 100,
      ) as FindResult;
    },
    count: async (options: CountOptions) => {
      const allDocs = collections[String(options.collection)] ?? [];
      const filtered = allDocs.filter((doc) => matchesCondition(doc, options.where));
      return { totalDocs: filtered.length } as CountResult;
    },
    findGlobal: async (options: FindGlobalOptions) => {
      const global = globals[String(options.slug)];
      if (!global) throw new Error(`Mock: global not found: ${String(options.slug)}`);
      return global as FindGlobalResult;
    },
  } as unknown as CmsQueryOperations;

  return fakePayload;
};
