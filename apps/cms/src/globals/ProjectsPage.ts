import type { GlobalConfig } from "payload";

export const ProjectsPage: GlobalConfig = {
  slug: "projects-page",
  label: "Projects Page",
  access: {
    read: () => true,
  },
  admin: {
    group: "Pages",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "sections",
              type: "array",
              required: true,
              minRows: 1,
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "description",
                  type: "richText",
                },
                {
                  name: "projects",
                  type: "relationship",
                  relationTo: "projects",
                  hasMany: true,
                  required: true,
                  minRows: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
