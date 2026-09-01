import type { GlobalConfig } from "payload";

import { publicReadAccess } from "@cms/access/readAccess";

export const BlogPage: GlobalConfig = {
  slug: "blog-page",
  label: "Blog Page",
  access: {
    read: publicReadAccess,
  },
  admin: {
    group: "Pages",
  },
  fields: [
    {
      type: "tabs",
      tabs: [],
    },
  ],
};
