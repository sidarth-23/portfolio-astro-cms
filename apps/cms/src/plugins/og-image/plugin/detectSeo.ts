import type { CollectionConfig, Config, Field, GlobalConfig } from "payload";

/**
 * Detect whether a field array contains the SEO meta group added by @payloadcms/plugin-seo.
 *
 * The SEO plugin adds fields in two configurations:
 *   - Non-tabbed: a top-level group field named "meta"
 *   - Tabbed (tabbedUI: true): a tabs field whose tabs contain a group named "meta"
 */
export function hasSeoMetaFields(fields: Field[] | undefined): boolean {
  if (!fields) return false;

  for (const field of fields) {
    if (field.type === "group" && "name" in field && field.name === "meta") {
      return true;
    }

    if (field.type === "tabs" && "tabs" in field) {
      for (const tab of field.tabs) {
        if (tab.fields?.some((f) => f.type === "group" && "name" in f && f.name === "meta")) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Returns the slugs of all collections that have SEO meta fields in the config.
 * Only works correctly when called after @payloadcms/plugin-seo has run.
 */
export function detectSeoCollections(config: Config): string[] {
  return (config.collections ?? [])
    .filter((col: CollectionConfig) => hasSeoMetaFields(col.fields))
    .map((col: CollectionConfig) => col.slug);
}

/**
 * Returns the slugs of all globals that have SEO meta fields in the config.
 * Only works correctly when called after @payloadcms/plugin-seo has run.
 */
export function detectSeoGlobals(config: Config): string[] {
  return (config.globals ?? [])
    .filter((glob: GlobalConfig) => hasSeoMetaFields(glob.fields))
    .map((glob: GlobalConfig) => glob.slug);
}

/**
 * Throws a descriptive error when no SEO-enabled entities are found.
 * This means @payloadcms/plugin-seo was not registered before ogImagePlugin.
 */
export function validateSeoPluginPresence(seoCollections: string[], seoGlobals: string[]): void {
  if (seoCollections.length === 0 && seoGlobals.length === 0) {
    throw new Error(
      "[og-image-plugin] No SEO-enabled collections or globals detected. " +
        "Ensure @payloadcms/plugin-seo is registered BEFORE ogImagePlugin in the plugins array.",
    );
  }
}
