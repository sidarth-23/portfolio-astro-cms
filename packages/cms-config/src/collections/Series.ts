import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";
import { syncSeriesPostsToPosts } from "../hooks/syncSeriesPostsToPosts";

import { slugField } from "../fields/slug";

export const Series: CollectionConfig = {
  slug: "series",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Taxonomy",
  },
  hooks: {
    afterChange: [syncSeriesPostsToPosts],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "posts",
      type: "relationship",
      relationTo: "posts",
      hasMany: true,
      required: false,
      admin: {
        description: "Select and reorder posts in this series.",
      },
    },
    slugField({ fieldToUse: "name" }),
  ],
};
