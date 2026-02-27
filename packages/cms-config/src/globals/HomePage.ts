import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";
import { syncHomeSectionsToPosts } from "../hooks/syncHomeSectionsToPosts";

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  access: {
    read: readAccess,
  },
  admin: {
    group: "Pages",
  },
  hooks: {
    afterChange: [syncHomeSectionsToPosts],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "greeting",
              type: "text",
              required: true,
            },
            {
              name: "name",
              type: "text",
              required: true,
            },
            {
              name: "role",
              type: "text",
              required: true,
            },
            {
              name: "about",
              type: "richText",
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: "ctaPrimaryLabel",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "ctaPrimaryUrl",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "ctaSecondaryLabel",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "ctaSecondaryUrl",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "featuredSections",
      type: "array",
      admin: {
        description: "Create and reorder featured sections for the home page.",
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "description",
          type: "richText",
          required: false,
        },
        {
          name: "posts",
          type: "relationship",
          relationTo: "posts",
          hasMany: true,
          required: false,
        },
      ],
    },
  ],
};
