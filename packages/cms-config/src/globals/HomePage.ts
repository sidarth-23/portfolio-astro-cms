import type { GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@sidshub/lexical/cms";

import { readAccess } from "../access/readAccess";
import { linkField } from "../fields/link";
import { syncHomeSectionsToPosts } from "../hooks/syncHomeSectionsToPosts";
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
    afterChange: [syncHomeSectionsToPosts],
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
            {
              name: "featuredSections",
              type: "array",
              admin: {
                description: "Create and reorder featured sections for the home page.",
                components: {
                  RowLabel: "./components/admin/rowLabels/SectionRowLabel#SectionRowLabel",
                },
              },
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                },
                {
                  name: "description",
                  type: "richText",
                  required: false,
                  editor: createBasicRichTextEditor(),
                },
                {
                  name: "posts",
                  type: "relationship",
                  relationTo: "posts",
                  hasMany: true,
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "ctaButtons",
      type: "array",
      required: false,
      maxRows: 3,
      admin: {
        position: "sidebar",
        components: {
          RowLabel: "./components/admin/rowLabels/CtaButtonRowLabel#CtaButtonRowLabel",
        },
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "variant",
          type: "select",
          required: true,
          defaultValue: "default",
          options: [
            {
              label: "Default",
              value: "default",
            },
            {
              label: "Primary",
              value: "primary",
            },
            {
              label: "Secondary",
              value: "secondary",
            },
            {
              label: "Accent",
              value: "accent",
            },
            {
              label: "Outline",
              value: "outline",
            },
            {
              label: "Ghost",
              value: "ghost",
            },
          ],
        },
        linkField({
          name: "link",
          label: "Link",
        }),
      ],
    },
  ],
};
