import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";

import { populateAuthors } from "../hooks/populateAuthors";
import { triggerDokployRedeploy } from "../hooks/triggerDokployRedeploy";
import { slugField } from "../fields/slug";

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
    afterRead: [populateAuthors],
    afterChange: [triggerDokployRedeploy],
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
              type: "relationship",
              relationTo: "tags",
              hasMany: true,
              required: false,
            },
            {
              name: "series",
              type: "relationship",
              relationTo: "series",
              required: false,
            },
            {
              name: "seriesOrder",
              type: "number",
              required: false,
              min: 1,
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
        },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          required: false,
        },
        {
          name: "linkedInUrl",
          type: "text",
        },
        {
          name: "githubUrl",
          type: "text",
        },
      ],
    },
    {
      name: "featureOnHome",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
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
