import type { GlobalConfig } from "payload";

import { publicReadAccess } from "@/access/readAccess";

export const SeriesPage: GlobalConfig = {
  slug: "series-page",
  label: "Series Page",
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
