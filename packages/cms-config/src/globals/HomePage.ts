import type { GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@sidshub/lexical/cms";

import { readAccess } from "../access/readAccess";
import { featuredField } from "../fields/featured";
import { createPayloadDataSchemaHook } from "../validation/payloadSchema";
import { homePageSchema } from "../validation/schemas";

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  access: {
    read: readAccess,
  },
  admin: {
    group: "Pages",
  },
  hooks: {
    beforeValidate: [createPayloadDataSchemaHook(homePageSchema, { errorPrefix: "Home page validation failed:" })],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "greeting",
              type: "text",
              required: true,
            },
            {
              name: "name",
              type: "text",
              required: true,
            },
            {
              name: "role",
              type: "text",
              required: true,
            },
            {
              name: "about",
              type: "richText",
              required: true,
              editor: createBasicRichTextEditor(),
            },
            featuredField({
              name: "featured",
              label: "Featured Work",
            }),
          ],
        },
      ],
    },
  ],
};
