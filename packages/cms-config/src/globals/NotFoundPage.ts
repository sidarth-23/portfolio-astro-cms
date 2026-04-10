import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";

export const NotFoundPage: GlobalConfig = {
  slug: "not-found-page",
  label: "404 Page",
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
              name: "title",
              type: "text",
              required: true,
              defaultValue: "404",
            },
            {
              name: "description",
              type: "textarea",
              required: true,
              defaultValue: "The page you're looking for couldn't be found.",
            },
            {
              name: "ctaLabel",
              type: "text",
              required: false,
              defaultValue: "Home",
            },
            {
              name: "ctaHref",
              type: "text",
              required: false,
              defaultValue: "/",
            },
            {
              name: "emoji",
              type: "text",
              required: false,
            },
          ],
        },
      ],
    },
  ],
};
