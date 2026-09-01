type CacheEntry = {
  value: Promise<unknown>;
  expiresAt: number;
};

const DEVELOPMENT_TTL = 5_000;
const PRODUCTION_TTL = 300_000;
const SEARCH_TTL = 60_000;

const isSsgBuild =
  import.meta.env.SSR && import.meta.env.PROD && process.env.NODE_ENV !== "production";

export class CmsCache {
  private readonly store = new Map<string, CacheEntry>();

  private readonly defaultTtlMs = isSsgBuild
    ? Infinity
    : import.meta.env.DEV
      ? DEVELOPMENT_TTL
      : PRODUCTION_TTL;
  getOrSet<T>(key: string, loader: () => Promise<T>, ttlMs = this.defaultTtlMs): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key);
    if (existing && (existing.expiresAt === Infinity || existing.expiresAt > now)) {
      return existing.value as Promise<T>;
    }

    const value = loader();
    const entry: CacheEntry = {
      value: value as Promise<unknown>,
      expiresAt: ttlMs === Infinity ? Infinity : now + ttlMs,
    };
    this.store.set(key, entry);
    void value.catch(() => {
      if (this.store.get(key) === entry) {
        this.store.delete(key);
      }
    });
    return value;
  }

  invalidate(prefix?: string): void {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export const cmsCache = new CmsCache();
export const cmsSearchCacheTtl = SEARCH_TTL;
