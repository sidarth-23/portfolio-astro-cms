import { resolveIconSvg } from "@sidshub/cms-lib-icons";
import type { ResolvedLink } from "@/lib/types";

export const resolveLinks = (
  links: Array<{ icon: string; url: string; newTab: boolean }>,
): ResolvedLink[] =>
  links.flatMap((link) => {
    const iconData = resolveIconSvg(link.icon);
    if (!iconData) return [];
    return [{ url: link.url, newTab: link.newTab, ...iconData }];
  });

export const generateFilterUrl = (currentUrl: URL, key: string, value: string): string => {
  const newUrl = new URL(currentUrl.toString());
  // If we are not on the blog page, reset to /blog
  if (newUrl.pathname !== "/blog") {
    newUrl.pathname = "/blog";
    newUrl.search = ""; // Clear existing params if we are navigating from a non-blog page
  }

  const params = newUrl.searchParams;
  const currentValue = params.get(key);

  if (currentValue === value) {
    // If the filter is already active, remove it (toggle off)
    params.delete(key);
  } else {
    // Otherwise set/replace it (toggle on / switch)
    params.set(key, value);
  }

  // Always reset page to 1 when changing filters
  if (params.has("page")) {
    params.delete("page");
  }

  return `${newUrl.pathname}${newUrl.search}`;
};
