import type { SeoFieldMapping } from "../../types";
import { proposeSeoMetaValues, getMetaDifferences } from "./seoFieldMapping";

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
 * Compute an SEO check for the given collection data and field mapping.
 *
 * Returns null when there is nothing actionable (no mapping, no meta, empty
 * meta — the server hook handles that case — or no differences).
 * Returns a SeoCheckResult when the client should offer to update meta.
 */
export function computeSeoCheck(
  mapping: SeoFieldMapping | undefined | null,
  data: Record<string, unknown>,
): SeoCheckResult | null {
  if (!mapping) return null;

  if (!data.meta || typeof data.meta !== "object") return null;

  const existingMeta = data.meta as Record<string, unknown>;

  // All meta fields are empty — the server hook handles first-save auto-populate
  if (!existingMeta.title && !existingMeta.description && !existingMeta.image) {
    return null;
  }

  const proposedMeta = proposeSeoMetaValues(data, mapping);
  const differences = getMetaDifferences(existingMeta, proposedMeta);

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
