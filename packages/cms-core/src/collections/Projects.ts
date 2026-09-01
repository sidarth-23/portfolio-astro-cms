import type { CollectionConfig } from "payload";
import { createDocumentRichTextEditor } from "@/lib/editor";
import { publishedReadAccess } from "@/access/readAccess";
import { iconPickerField } from "@sidshub/cms-lib-icons";
import { linkFields } from "@/fields/link";
import { slugField } from "@/fields/slug";
import { projectsSchema, createPayloadDataSchemaHook } from "@/lib/validation";

export const Projects: CollectionConfig = {
  slug: "projects",
  access: {
    read: publishedReadAccess,
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
