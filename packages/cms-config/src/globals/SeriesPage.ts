import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { seriesPageSchema } from "../lib/validation/schemas";

export const SeriesPage: GlobalConfig = {
  slug: "series-page",
  label: "Series Page",
  access: {
    read: readAccess,
  },
  admin: {
    group: "Pages",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(seriesPageSchema, {
        errorPrefix: "Series page validation failed:",
      }),
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
