import type { CollectionConfig } from "payload";

import { slugField } from "../fields/slug";

export const Series: CollectionConfig = {
  slug: "series",
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
