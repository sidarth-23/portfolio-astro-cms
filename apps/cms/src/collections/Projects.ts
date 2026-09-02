import type { CollectionConfig } from "payload";
import { createDocumentRichTextEditor } from "@cms/lib/editor";
import { adminAccess, publishedReadAccess } from "@cms/access/readAccess";
import { iconPickerField } from "@cms/lib/icons/field";
import { linkFields } from "@cms/fields/link";
import { slugField } from "@cms/fields/slug";
import { projectsSchema, createPayloadDataSchemaHook } from "@cms/lib/validation";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: publishedReadAccess,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
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
              type: "textarea",
              required: true,
            },
            {
              name: "coverImage",
              type: "upload",
              relationTo: "media",
              required: true,
            },
            {
              name: "content",
              type: "richText",
              required: true,
              editor: createDocumentRichTextEditor({
                enabledHeadingSizes: ["h2", "h3", "h4"],
                enableCallout: true,
                enableImageGallery: true,
                calloutVariantProfile: "generic",
              }),
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
