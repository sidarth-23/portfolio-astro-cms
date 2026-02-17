import type { CollectionConfig } from "payload";

import { slugField } from "../fields/slug";

export const Series: CollectionConfig = {
  slug: "series",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Taxonomy",
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
    slugField({ fieldToUse: "name" }),
  ],
};
