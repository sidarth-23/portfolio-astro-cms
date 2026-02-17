import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";

import { slugField } from "../fields/slug";
import { triggerDokployRedeploy } from "../hooks/triggerDokployRedeploy";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "displayOrder", "updatedAt"],
    group: "Content",
  },
  hooks: {
    afterChange: [triggerDokployRedeploy],
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
              name: "badges",
              type: "array",
              fields: [
                {
                  name: "value",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "techTags",
              type: "array",
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
    {
      name: "displayOrder",
      type: "number",
      defaultValue: 0,
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
