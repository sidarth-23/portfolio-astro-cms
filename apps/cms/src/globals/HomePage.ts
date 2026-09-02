import type { GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@cms/lib/editor";

import { adminAccess, publicReadAccess } from "@cms/access/readAccess";
import { featuredSectionFields } from "@cms/fields/featured";
import { linkField } from "@cms/fields/link";
import { HOME_CTA_VARIANT_OPTIONS } from "@cms/lib/content";
import { createPayloadDataSchemaHook, homePageSchema } from "@cms/lib/validation";

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  access: {
    read: publicReadAccess,
    update: adminAccess,
  },
  admin: {
    group: "Pages",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(homePageSchema, { errorPrefix: "Home page validation failed:" }),
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
