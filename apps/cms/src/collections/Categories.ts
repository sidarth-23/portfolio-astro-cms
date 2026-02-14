import type { CollectionConfig } from "payload";

import { seoOverridesField } from "../fields/seoOverrides";
import { slugField } from "../fields/slug";

export const Categories: CollectionConfig = {
  slug: "categories",
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
    {
      name: "parentCategory",
      type: "relationship",
      relationTo: "categories",
      required: false,
    },
    seoOverridesField,
  ],
};
