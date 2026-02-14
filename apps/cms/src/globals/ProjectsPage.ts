import type { GlobalConfig } from "payload";

export const ProjectsPage: GlobalConfig = {
  slug: "projects-page",
  label: "Projects Page",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "featuredTitle",
      type: "text",
      required: true,
      defaultValue: "Some of my pass times </>",
    },
    {
      name: "featuredDescription",
      type: "textarea",
      required: true,
    },
    {
      name: "newbieTitle",
      type: "text",
      required: true,
      defaultValue: "Newbie Me </>",
    },
    {
      name: "newbieDescription",
      type: "textarea",
      required: true,
    },
  ],
};
