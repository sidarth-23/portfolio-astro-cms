import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: () => true,
  },
  admin: {
    group: "Site",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "siteTitle",
              type: "text",
              required: true,
            },
            {
              name: "siteDescription",
              type: "textarea",
              required: true,
            },
            {
              name: "defaultOgImage",
              type: "upload",
              relationTo: "media",
              required: false,
            },
          ],
        },
      ],
    },
    {
      name: "linkedInUrl",
      type: "text",
      required: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "githubUrl",
      type: "text",
      required: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "email",
      type: "text",
      required: false,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
