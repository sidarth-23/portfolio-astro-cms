import type { CollectionConfig } from "payload";
import { createBasicRichTextEditor, createDocumentRichTextEditor } from "@/lib/editor";
import { readAccess } from "@/access/readAccess";
import { populateAuthors } from "@/hooks/populateAuthors";
import { populateSeries } from "@/hooks/populateSeries";
import { createSuggestMetadataAutoPopulationHook } from "@/hooks/suggestMetadataAutoPopulation";
import { slugField } from "@/fields/slug";
import { createPayloadDataSchemaHook, postsSchema } from "@/lib/validation";

export const Posts: CollectionConfig = {
  slug: "posts",
  access: {
    read: readAccess,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "publishedAt", "updatedAt"],
    group: "Content",
    components: {
      edit: {
        SaveDraftButton: "@sidshub/cms-plugin-og-image/ui#SeoSaveDraftButton",
        PublishButton: "@sidshub/cms-plugin-og-image/ui#SeoPublishButton",
      },
    },
  },
  hooks: {
    beforeChange: [createSuggestMetadataAutoPopulationHook("posts")],
    beforeValidate: [
      createPayloadDataSchemaHook(postsSchema, { errorPrefix: "Posts validation failed:" }),
    ],
    afterRead: [populateAuthors, populateSeries],
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
                calloutVariantProfile: "blog",
              }),
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
              name: "seriesLinks",
              type: "join",
              collection: "series",
              on: "posts",
              maxDepth: 1,
              admin: {
                hidden: true,
              },
            },
          ],
        },
      ],
    },
    slugField({ fieldToUse: "title" }),
    {
      name: "series",
      type: "relationship",
      relationTo: "series",
      hasMany: true,
      virtual: true,
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "View only. Manage membership and ordering from the Series collection.",
      },
    },
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
      required: true,
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
          type: "text",
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
  ],
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
};
