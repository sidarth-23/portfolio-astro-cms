import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";

export const BlogPage: GlobalConfig = {
  slug: "blog-page",
  label: "Blog Page",
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
              name: "seriesSeoTitleTemplate",
              type: "text",
              required: false,
              admin: {
                description:
                  "SEO title template for series pages. Use {seriesName} to insert the series name. Falls back to the page SEO title if empty.",
              },
            },
            {
              name: "seriesSeoDescriptionTemplate",
              type: "textarea",
              required: false,
              admin: {
                description:
                  "SEO description template for series pages. Use {seriesName} to insert the series name. Falls back to the page SEO description if empty.",
              },
            },
          ],
        },
      ],
    },
  ],
};
