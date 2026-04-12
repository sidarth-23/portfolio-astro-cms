import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";

import { slugField } from "../fields/slug";
import { createPayloadDataSchemaHook } from "../validation/payloadSchema";
import { projectsSchema } from "../validation/schemas";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "updatedAt"],
    group: "Content",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(projectsSchema, {
        errorPrefix: "Projects validation failed:",
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
              name: "title",
              type: "text",
              required: true,
            },
            {
              name: "description",
              type: "richText",
              required: true,
            },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: false,
            },
            {
              name: "externalUrl",
              type: "text",
              required: true,
            },
            {
              name: "githubUrl",
              type: "text",
              required: false,
            },
            {
              name: "badges",
              type: "array",
              admin: {
                components: {
                  RowLabel: "./components/admin/rowLabels/BadgeRowLabel#BadgeRowLabel",
                },
              },
              fields: [
                {
                  name: "value",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "tags",
              type: "array",
              admin: {
                components: {
                  RowLabel: "./components/admin/rowLabels/BadgeRowLabel#BadgeRowLabel",
                },
              },
              fields: [
                {
                  name: "value",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    slugField({ fieldToUse: "title" }),
  ],
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
