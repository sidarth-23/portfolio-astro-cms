type PageRoute = "home" | "blog" | "projects" | "cv" | "rss";

export const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/^-+|-+$/g, "");
};

export const PAGE_ROUTE_MAP: Record<PageRoute, string> = {
  home: "/",
  blog: "/blog",
  projects: "/projects",
  cv: "/cv",
  rss: "/rss.xml",
};
