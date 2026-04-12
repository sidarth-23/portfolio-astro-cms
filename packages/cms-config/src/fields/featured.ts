import type { CollectionSlug, Field } from "payload";

type FeaturedFieldArgs = {
  name?: string;
  label?: string;
  relationTo?: CollectionSlug[];
  maxItems?: number;
};

export const featuredField = ({
  name = "featured",
  label = "Featured",
  relationTo = ["posts", "projects"],
  maxItems,
}: FeaturedFieldArgs = {}): Field => {
  return {
    name,
    label,
    type: "group",
    fields: [
      {
        name: "title",
        type: "text",
        required: false,
      },
      {
        name: "description",
        type: "text",
        required: false,
      },
      {
        name: "items",
        type: "relationship",
        relationTo,
        hasMany: true,
        required: false,
        ...(maxItems ? { maxRows: maxItems } : {}),
      },
    ],
  };
};
