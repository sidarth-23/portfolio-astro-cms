import type { GlobalConfig } from "payload";

import { readAccess } from "@/access/readAccess";

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
      tabs: [],
    },
  ],
};
