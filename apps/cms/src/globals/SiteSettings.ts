import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "siteTitle",
      type: "text",
      required: true,
      defaultValue: "Sidarth",
    },
    {
      name: "siteDescription",
      type: "textarea",
      required: true,
      defaultValue: "Welcome to my website!",
    },
    {
      name: "defaultOgImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
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
    {
      name: "email",
      type: "text",
      required: false,
    },
  ],
};
