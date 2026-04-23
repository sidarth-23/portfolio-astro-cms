import type { SeoFieldMapping } from "../types";

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

export function extractImageField(
  data: Record<string, unknown>,
  fieldName: string | null,
): string | number | null {
  if (!fieldName) return null;

  const value = extractFieldValue(data, fieldName);
  if (value) return value;

  const parts = fieldName.split(".");
  let field: unknown = data;

  for (const part of parts) {
    if (field && typeof field === "object" && part in field) {
      field = (field as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  if (field && typeof field === "object" && "id" in field) {
    return (field as { id: string | number }).id;
  }

  if (typeof field === "number" || typeof field === "string") {
    return field;
  }

  return null;
}

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

export type MetaDifferences = {
  hasDifferences: boolean;
  title?: { existing: string; proposed: string };
  description?: { existing: string; proposed: string };
  image?: { existing: string | number | null; proposed: string | number | null };
};

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
