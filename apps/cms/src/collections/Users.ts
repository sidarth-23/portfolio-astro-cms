import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "updatedAt"],
    group: "Admin",
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
              name: "bio",
              type: "richText",
              required: false,
            },
            {
              name: "avatar",
              type: "upload",
              relationTo: "media",
              required: false,
            },
          ],
        },
        {
          label: "Settings",
          fields: [
            {
              name: "linkedInUrl",
              type: "text",
              required: false,
            },
            {
              name: "githubUrl",
              type: "text",
              required: false,
            },
          ],
        },
      ],
    },
  ],
};
