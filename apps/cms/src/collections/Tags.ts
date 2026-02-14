import type { CollectionConfig } from "payload";

import { slugField } from "../fields/slug";

export const Tags: CollectionConfig = {
  slug: "tags",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    slugField({ fieldToUse: "name" }),
    {
      name: "description",
      type: "textarea",
    },
  ],
};
