/**
 * SEO Field Mapping Configuration
 *
 * Defines which source fields to use for auto-populating SEO meta fields
 * (meta.title, meta.description, meta.image) for each collection.
 *
 * This allows the system to intelligently suggest meta values based on
 * existing content fields, reducing manual data entry for editors.
 */

export type SeoFieldMapping = {
  /** Collection slug identifier */
  slug: "posts" | "projects" | "series";
  /** Field name to use as source for meta.title */
  titleField: string;
  /** Field name to use as source for meta.description */
  descriptionField: string;
  /** Field name to use as source for meta.image (null if collection has no image field) */
  imageField: string | null;
};

/**
 * Mapping of collections to their SEO source fields
 */
export const SEO_FIELD_MAPPINGS: Record<string, SeoFieldMapping> = {
  posts: {
    slug: "posts",
    titleField: "title",
    descriptionField: "description",
    imageField: "coverImage",
  },
  projects: {
    slug: "projects",
    titleField: "title",
    descriptionField: "description",
    imageField: "coverImage",
  },
  series: {
    slug: "series",
    titleField: "name",
    descriptionField: "description",
    imageField: null,
  },
};

/**
 * Get the SEO field mapping for a collection
 *
 * @param collectionSlug - The collection slug (e.g., "posts", "projects", "series")
 * @returns The field mapping configuration, or undefined if collection has no mapping
 */
export function getSeoFieldMapping(collectionSlug: string): SeoFieldMapping | undefined {
  return SEO_FIELD_MAPPINGS[collectionSlug];
}

/**
 * Extract text value from a data object using a field name
 *
 * @param data - The object containing the field values
 * @param fieldName - The field name to extract (supports nested paths with dot notation)
 * @returns The string value, or empty string if field not found or not a string
 */
export function extractFieldValue(data: Record<string, unknown>, fieldName: string): string {
  const parts = fieldName.split(".");
  let value: unknown = data;

  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return "";
    }
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

/**
 * Extract image ID from a data object using a field name
 *
 * @param data - The object containing the image field
 * @param fieldName - The field name to extract (the image field)
 * @returns The image ID (string | number) if found, null otherwise
 *
 * Note: The image field can be:
 * - A Payload media relationship ID (number or string)
 * - A Media object with { id: number | string, ... }
 * - null or undefined
 */
export function extractImageField(
  data: Record<string, unknown>,
  fieldName: string | null,
): string | number | null {
  if (!fieldName) return null;

  const value = extractFieldValue(data, fieldName);
  if (value) return value;

  // Try to extract from media object
  const parts = fieldName.split(".");
  let field: unknown = data;

  for (const part of parts) {
    if (field && typeof field === "object" && part in field) {
      field = (field as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  // If it's a media object with id
  if (field && typeof field === "object" && "id" in field) {
    return (field as { id: string | number }).id;
  }

  // If it's a direct ID
  if (typeof field === "number" || typeof field === "string") {
    return field;
  }

  return null;
}

/**
 * Propose SEO meta values based on source fields
 *
 * @param data - The collection entry data
 * @param mapping - The SEO field mapping for this collection
 * @returns Suggested meta values { title, description, image? }
 */
export function proposeSeoMetaValues(
  data: Record<string, unknown>,
  mapping: SeoFieldMapping,
): {
  title: string;
  description: string;
  image: string | number | null;
} {
  const title = extractFieldValue(data, mapping.titleField);
  const description = extractFieldValue(data, mapping.descriptionField);
  const image = extractImageField(data, mapping.imageField);

  return {
    title,
    description,
    image: image ?? null,
  };
}

type MetaDifferences = {
  hasDifferences: boolean;
  title?: { existing: string; proposed: string };
  description?: { existing: string; proposed: string };
  image?: { existing: string | number | null; proposed: string | number | null };
};

/**
 * Check if proposed meta values differ from existing meta values
 *
 * @param existing - The existing meta object from the database
 * @param proposed - The newly proposed meta values
 * @returns Object indicating which fields differ, with proposed vs existing values
 */
export function getMetaDifferences(
  existing: Record<string, unknown>,
  proposed: {
    title: string;
    description: string;
    image: string | number | null;
  },
): MetaDifferences {
  const differences: MetaDifferences = {
    hasDifferences: false,
  };

  if (existing.title !== proposed.title) {
    differences.title = {
      existing: typeof existing.title === "string" ? existing.title : "",
      proposed: proposed.title,
    };
    differences.hasDifferences = true;
  }

  if (existing.description !== proposed.description) {
    differences.description = {
      existing: typeof existing.description === "string" ? existing.description : "",
      proposed: proposed.description,
    };
    differences.hasDifferences = true;
  }

  if (existing.image !== proposed.image) {
    const existingImage = existing.image;
    differences.image = {
      existing:
        typeof existingImage === "string" || typeof existingImage === "number"
          ? existingImage
          : null,
      proposed: proposed.image,
    };
    differences.hasDifferences = true;
  }

  return differences;
}
