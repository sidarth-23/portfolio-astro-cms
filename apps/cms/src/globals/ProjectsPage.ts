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
              name: "featuredTitle",
              type: "text",
              required: true,
            },
            {
              name: "featuredDescription",
              type: "richText",
              required: true,
            },
            {
              name: "newbieTitle",
              type: "text",
              required: true,
            },
            {
              name: "newbieDescription",
              type: "richText",
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
