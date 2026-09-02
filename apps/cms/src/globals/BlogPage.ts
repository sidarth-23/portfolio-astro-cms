import type { GlobalConfig } from "payload";

import { adminAccess, publicReadAccess } from "@cms/access/readAccess";

export const BlogPage: GlobalConfig = {
  slug: "blog-page",
  label: "Blog Page",
  access: {
    read: publicReadAccess,
    update: adminAccess,
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
