import type { GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@sidshub/cms-editor/cms";

import { readAccess } from "../access/readAccess";
import { featuredSectionFields } from "../fields/featured";
import { linkField } from "../fields/link";
import { syncHomeSectionsToPosts } from "../hooks/syncHomeSectionsToPosts";
import { HOME_CTA_VARIANT_OPTIONS } from "../lib/content";
import { createPayloadDataSchemaHook } from "../lib/validation";
import { homePageSchema } from "../lib/validation";

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
              fields: featuredSectionFields({
                relationTo: ["posts", "projects"],
                descriptionEditor: createBasicRichTextEditor(),
              }),
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
          options: HOME_CTA_VARIANT_OPTIONS,
        },
        linkField({
          name: "link",
          label: "Link",
        }),
      ],
    },
  ],
};
