import type { GlobalConfig } from "payload";

import { adminAccess, publicReadAccess } from "@cms/access/readAccess";

export const SeriesPage: GlobalConfig = {
  slug: "series-page",
  label: "Series Page",
  access: {
    read: publicReadAccess,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
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
