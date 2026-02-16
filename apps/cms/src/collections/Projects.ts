import type { CollectionConfig } from "payload";

import { triggerDokployRedeploy } from "../hooks/triggerDokployRedeploy";
import { slugField } from "../fields/slug";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "section", "displayOrder", "updatedAt"],
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
              name: "summary",
              type: "textarea",
              required: true,
            },
            {
              name: "description",
              type: "richText",
              required: false,
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
              name: "badge",
              type: "text",
              required: false,
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
        {
          label: "Settings",
          fields: [
            slugField({ fieldToUse: "title" }),
            {
              name: "section",
              type: "select",
              required: true,
              defaultValue: "featured",
              options: ["featured", "newbie"],
            },
            {
              name: "displayOrder",
              type: "number",
              defaultValue: 0,
              required: true,
            },
          ],
        },
      ],
    },
  ],
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
