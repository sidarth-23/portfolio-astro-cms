import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  access: {
    read: readAccess,
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
      name: "featuredSectionTitle",
      type: "text",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
