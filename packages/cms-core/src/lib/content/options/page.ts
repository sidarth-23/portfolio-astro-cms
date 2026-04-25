import { defineOptions } from "./utils";

export const PAGE_ROUTE_OPTIONS = defineOptions([
  { label: "Home", value: "home" },
  { label: "Blog", value: "blog" },
  { label: "Projects", value: "projects" },
  { label: "CV", value: "cv" },
  { label: "RSS", value: "rss" },
]);

export type PageRoute = (typeof PAGE_ROUTE_OPTIONS)[number]["value"];
