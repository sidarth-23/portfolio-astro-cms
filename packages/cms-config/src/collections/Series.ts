import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";

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
