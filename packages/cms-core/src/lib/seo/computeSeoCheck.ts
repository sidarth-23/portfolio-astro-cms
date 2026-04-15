/**
 * computeSeoCheck
 *
 * Pure utility (no React, no server-only code) that computes whether SEO
 * metadata differences exist between the current saved meta and the values
 * that would be proposed from the document's source fields.
 *
 * Returns null when there is nothing actionable (no mapping, no meta, empty
 * meta — the server hook handles that case — or no differences).
 * Returns a SeoCheckResult when the client should offer to update meta.
 */

import {
  getSeoFieldMapping,
  proposeSeoMetaValues,
  getMetaDifferences,
} from "@/lib/seoFieldMapping";

export type SeoCheckResult = {
  differences: {
    hasDifferences: boolean;
    title?: { existing: string; proposed: string };
    description?: { existing: string; proposed: string };
    image?: { existing: string | number | null; proposed: string | number | null };
  };
  proposedMeta: {
    title: string;
    description: string;
    image: string | number | null;
  };
  currentMeta: {
    title: string;
    description: string;
    image: string | number | null;
  };
};

/**
 * Compute an SEO check for the given collection + document data.
 *
 * @param collectionSlug - The Payload collection slug (e.g. "posts", "projects", "series")
 * @param data           - The full document data object
 * @returns SeoCheckResult when actionable differences exist, null otherwise
 */
export function computeSeoCheck(
  collectionSlug: string | undefined,
  data: Record<string, unknown>,
): SeoCheckResult | null {
  // No slug — nothing to check
  if (!collectionSlug) return null;

  // No mapping for this collection
  const mapping = getSeoFieldMapping(collectionSlug);
  if (!mapping) return null;

  // No meta field at all
  if (!data.meta || typeof data.meta !== "object") return null;

  const existingMeta = data.meta as Record<string, unknown>;

  // All meta fields are empty — the server hook handles first-save auto-populate
  if (!existingMeta.title && !existingMeta.description && !existingMeta.image) {
    return null;
  }

  const proposedMeta = proposeSeoMetaValues(data, mapping);
  const differences = getMetaDifferences(existingMeta, proposedMeta);

  // No actionable differences
  if (!differences.hasDifferences) return null;

  return {
    differences,
    proposedMeta,
    currentMeta: {
      title: (existingMeta.title as string) || "",
      description: (existingMeta.description as string) || "",
      image: (existingMeta.image as string | number | null) || null,
    },
  };
}
