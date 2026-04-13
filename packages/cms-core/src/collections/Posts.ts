import type { CollectionConfig } from "payload";
import { createBasicRichTextEditor, createDocumentRichTextEditor } from "@sidshub/cms-editor/cms";

import { readAccess } from "../access/readAccess";

import { populateAuthors } from "../hooks/populateAuthors";
import { slugField } from "../fields/slug";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { postsSchema } from "../lib/validation/schemas";

export const Posts: CollectionConfig = {
  slug: "posts",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "publishedAt", "updatedAt"],
    group: "Content",
  },
  hooks: {
    beforeValidate: [createPayloadDataSchemaHook(postsSchema, { errorPrefix: "Posts validation failed:" })],
    afterRead: [populateAuthors],
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
              name: "excerpt",
              type: "textarea",
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
                calloutVariantProfile: "blog",
              }),
            },
            {
              name: "coverImage",
              type: "upload",
              relationTo: "media",
              required: false,
            },
            {
              name: "primaryCategory",
              type: "relationship",
              relationTo: "categories",
              required: true,
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
            {
              name: "series",
              type: "relationship",
              relationTo: "series",
              required: false,
              admin: {
                readOnly: true,
                description: "Managed from the Series collection.",
              },
              access: {
                create: () => false,
                update: () => false,
              },
            },
          ],
        },
      ],
    },
    slugField({ fieldToUse: "title" }),
    {
      name: "publishedAt",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === "published" && !value) {
              return new Date();
            }

            return value;
          },
        ],
      },
    },
    {
      name: "authors",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      required: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "populatedAuthors",
      type: "array",
      access: {
        update: () => false,
      },
      admin: {
        position: "sidebar",
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: "id",
          type: "number",
        },
        {
          name: "name",
          type: "text",
        },
        {
          name: "bio",
          type: "richText",
          editor: createBasicRichTextEditor(),
        },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          required: false,
        },
        {
          // Minimal projection of the User links shape (icon, url, newTab only — fields populateAuthors writes).
          // Full definition in Users.ts; reference/page link types are not captured here since the hook resolves URLs.
          name: "links",
          type: "array",
          fields: [
            { name: "icon", type: "text" },
            { name: "url", type: "text" },
            { name: "newTab", type: "checkbox" },
          ],
        },
      ],
    },
    {
      name: "homeSectionsSummary",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Managed from Home Page featured sections.",
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
