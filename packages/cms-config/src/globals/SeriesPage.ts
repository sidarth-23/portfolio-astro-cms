import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";

export const SeriesPage: GlobalConfig = {
  slug: "series-page",
  label: "Series Page",
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
              name: "backToSeriesLabel",
              type: "text",
              required: false,
              defaultValue: "Back to Series",
            },
          ],
        },
      ],
    },
  ],
};
