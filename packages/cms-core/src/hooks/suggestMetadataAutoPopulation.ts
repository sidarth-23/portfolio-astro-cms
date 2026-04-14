/**
 * SEO Metadata Auto-Population Hook
 *
 * This hook intercepts save operations on Posts, Projects, and Series collections
 * to intelligently suggest SEO metadata auto-population.
 *
 * Flow:
 * 1. On save: Calculate proposed meta values from source fields (title, description, image)
 * 2. If no existing meta OR matches proposed: Auto-apply silently (no modal)
 * 3. If existing meta differs from proposed: Store suggestions in context to trigger modal
 * 4. Modal shows current vs proposed with checkboxes (unchecked by default)
 * 5. After user selection: Hook re-runs with confirmed fields, applies only checked changes
 */

import type { CollectionBeforeChangeHook } from "payload";
import type { SeoFieldMapping } from "../lib/seoFieldMapping";
import {
  getSeoFieldMapping,
  proposeSeoMetaValues,
  getMetaDifferences,
} from "../lib/seoFieldMapping";

export type SeoSuggestions = {
  /** Current meta values in the database */
  currentMeta: {
    title: string;
    description: string;
    image: string | number | null;
  };
  /** Proposed new meta values based on source fields */
  proposedMeta: {
    title: string;
    description: string;
    image: string | number | null;
  };
  /** Differences between current and proposed */
  differences: {
    title?: { existing: string; proposed: string };
    description?: { existing: string; proposed: string };
    image?: { existing: string | number | null; proposed: string | number | null };
  };
  /** Field mapping used */
  mapping: SeoFieldMapping;
};

export type SeoConfirmation = {
  /** Which fields the user confirmed to update */
  fieldsToUpdate: Array<"title" | "description" | "image">;
};

/**
 * Type guard: Check if the incoming data object looks like it has a meta field
 */
function hasMetaField(data: any): data is { meta: Record<string, any> } {
  return data && typeof data === "object" && "meta" in data && typeof data.meta === "object";
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
  return async ({ data, operation, req }) => {
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

    // Check if user already confirmed via modal (second pass after modal interaction)
    const confirmation = (req.context?.seoConfirmation) as SeoConfirmation | undefined;

    if (confirmation) {
      // Second pass: Apply only the fields user confirmed
      const proposed = proposeSeoMetaValues(data, mapping);

      if (confirmation.fieldsToUpdate.includes("title")) {
        data.meta.title = proposed.title;
      }
      if (confirmation.fieldsToUpdate.includes("description")) {
        data.meta.description = proposed.description;
      }
      if (confirmation.fieldsToUpdate.includes("image")) {
        data.meta.image = proposed.image;
      }

      // Clear the confirmation flag so it doesn't apply again
      delete req.context.seoConfirmation;

      return data;
    }

    // First pass: Check if suggestion is needed
    const proposed = proposeSeoMetaValues(data, mapping);
    const existingMeta = data.meta || {};

    // If no existing meta, auto-apply silently
    if (!existingMeta.title && !existingMeta.description && !existingMeta.image) {
      data.meta.title = proposed.title;
      data.meta.description = proposed.description;
      if (proposed.image) {
        data.meta.image = proposed.image;
      }
      return data;
    }

    // Check if there are differences
    const differences = getMetaDifferences(existingMeta, proposed);

    if (!differences.hasDifferences) {
      // No differences, nothing to do
      return data;
    }

    // Differences found: Store suggestions in context to trigger modal
    // The modal/UI layer will detect this and show the confirmation dialog
    (req.context as any).seoSuggestions = {
      currentMeta: {
        title: existingMeta.title || "",
        description: existingMeta.description || "",
        image: existingMeta.image || null,
      },
      proposedMeta: proposed,
      differences: differences,
      mapping,
    } as SeoSuggestions;

    // Signal that modal handling is needed
    // We set a flag on the data that can be detected by downstream logic
    (data as any)._seoSuggestionsNeeded = true;

    // Return data unmodified for now; the modal will handle confirmation
    // and then re-trigger the save with seoConfirmation in the context
    return data;
  };
}
