import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";

import { slugField } from "../fields/slug";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { tagsSchema } from "../lib/validation/schemas";

export const Tags: CollectionConfig = {
  slug: "tags",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Taxonomy",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(tagsSchema, {
        errorPrefix: "Tags validation failed:",
      }),
    ],
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
