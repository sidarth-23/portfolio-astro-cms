export function createGlobalCache() {
  const shouldCache = process.env.ASTRO_BUILD_CACHE_GLOBALS === "true";
  const store = new Map<string, Promise<unknown>>();

  return function getCachedGlobal<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (!shouldCache) {
      return loader();
    }

    const existing = store.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const next = loader();
    store.set(key, next as Promise<unknown>);
    return next;
  };
}
