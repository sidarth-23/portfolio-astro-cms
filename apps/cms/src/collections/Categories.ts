import type { CollectionConfig } from "payload";

import { slugField } from "../fields/slug";

export const Categories: CollectionConfig = {
  slug: "categories",
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
      type: "tabs",
      tabs: [
        {
          label: "Content",
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
              name: "parentCategory",
              type: "relationship",
              relationTo: "categories",
              required: false,
            },
          ],
        },
        {
          label: "Settings",
          fields: [slugField({ fieldToUse: "name" })],
        },
      ],
    },
  ],
};
