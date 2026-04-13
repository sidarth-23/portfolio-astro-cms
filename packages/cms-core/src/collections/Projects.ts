import type { CollectionConfig } from "payload";
import { createBasicRichTextEditor } from "@sidshub/cms-editor/cms";

import { readAccess } from "../access/readAccess";

import { iconPickerField } from "../fields/iconPicker";
import { linkFields } from "../fields/link";
import { slugField } from "../fields/slug";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { projectsSchema } from "../lib/validation/schemas";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "updatedAt"],
    group: "Content",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(projectsSchema, {
        errorPrefix: "Projects validation failed:",
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
              name: "title",
              type: "text",
              required: true,
            },
            {
              name: "description",
              type: "richText",
              required: true,
              editor: createBasicRichTextEditor(),
            },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: false,
            },
            {
              name: "badges",
              type: "array",
              admin: {
                components: {
                  RowLabel: "./components/admin/rowLabels/BadgeRowLabel#BadgeRowLabel",
                },
              },
              fields: [
                {
                  name: "value",
                  type: "text",
                  required: true,
                },
                iconPickerField(),
              ],
            },
            {
              name: "tags",
              type: "array",
              admin: {
                components: {
                  RowLabel: "./components/admin/rowLabels/BadgeRowLabel#BadgeRowLabel",
                },
              },
              fields: [
                {
                  name: "value",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "links",
      type: "array",
      required: false,
      admin: {
        position: "sidebar",
        components: {
          RowLabel: "./components/admin/rowLabels/LinkRowLabel#LinkRowLabel",
        },
      },
      fields: linkFields({ variant: "icon-only" }),
    },
    slugField({ fieldToUse: "title" }),
  ],
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
