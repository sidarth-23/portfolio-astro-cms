/**
 * SEO Metadata Auto-Population Hook
 *
 * Handles only the first-save case: when ALL meta fields are empty, auto-populate
 * them from the document's source fields (title, description, image).
 *
 * When meta already exists, client-side button wrappers (backed by computeSeoCheck)
 * handle the comparison and offer to update individual fields.
 */

import type { CollectionBeforeChangeHook } from "payload";
import { getSeoFieldMapping, proposeSeoMetaValues } from "../lib/seoFieldMapping";

/**
 * Type guard: Check if the incoming data object has a meta field
 */
function hasMetaField(data: unknown): data is { meta: Record<string, unknown> } {
  return data !== null && typeof data === "object" && "meta" in data && typeof data.meta === "object";
}

/**
 * Create the SEO metadata auto-population hook for a collection
 *
 * @param collectionSlug - The collection slug ("posts", "projects", or "series")
 * @returns A beforeChange hook function
 */
export function createSuggestMetadataAutoPopulationHook(
  collectionSlug: "posts" | "projects" | "series",
): CollectionBeforeChangeHook {
  return ({ data, operation }) => {
    // Skip if not creating or updating
    if (operation !== "create" && operation !== "update") {
      return data;
    }

    // Skip if no meta field in data
    if (!hasMetaField(data)) {
      return data;
    }

    const mapping = getSeoFieldMapping(collectionSlug);
    if (!mapping) {
      return data;
    }

    const existingMeta = data.meta;

    // Only auto-populate when ALL meta fields are empty (first save).
    // Client-side buttons handle the case where meta already exists.
    if (!existingMeta.title && !existingMeta.description && !existingMeta.image) {
      const proposed = proposeSeoMetaValues(data, mapping);
      data.meta.title = proposed.title;
      data.meta.description = proposed.description;
      if (proposed.image) {
        data.meta.image = proposed.image;
      }
    }

    return data;
  };
}
