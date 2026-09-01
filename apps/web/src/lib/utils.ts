export const generateFilterUrl = (currentUrl: URL, key: string, value: string): string => {
  const newUrl = new URL(currentUrl.toString());
  // If we are not on the runtime blog search route, reset to /blog/search
  if (newUrl.pathname !== "/blog/search") {
    newUrl.pathname = "/blog/search";
    newUrl.search = "";
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
