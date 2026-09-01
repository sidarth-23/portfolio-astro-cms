import type { CollectionConfig } from "payload";
import { publicReadAccess } from "@/access/readAccess";
import { slugField } from "@/fields/slug";
import { createPayloadDataSchemaHook, categoriesSchema } from "@/lib/validation";

export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    read: publicReadAccess,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Taxonomy",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(categoriesSchema, {
        errorPrefix: "Categories validation failed:",
      }),
    ],
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
      ],
    },
    slugField({ fieldToUse: "name" }),
  ],
};
