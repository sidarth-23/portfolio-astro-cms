import type { GlobalConfig } from "payload";

import { readAccess } from "@/access/readAccess";
import { createPayloadDataSchemaHook, blogPageSchema } from "@/lib/validation";

export const BlogPage: GlobalConfig = {
  slug: "blog-page",
  label: "Blog Page",
  access: {
    read: readAccess,
  },
  admin: {
    group: "Pages",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(blogPageSchema, { errorPrefix: "Blog page validation failed:" }),
    ],
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
            },
            {
              name: "intro",
              type: "textarea",
              required: false,
            },
          ],
        },
      ],
    },
  ],
};
