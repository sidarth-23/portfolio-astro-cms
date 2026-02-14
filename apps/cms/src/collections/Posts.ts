import type { CollectionConfig } from "payload";

import { addContentMarkdown } from "../hooks/addContentMarkdown";
import { triggerDokployRedeploy } from "../hooks/triggerDokployRedeploy";
import { seoOverridesField } from "../fields/seoOverrides";
import { slugField } from "../fields/slug";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug;
        return slug ? `https://www.sidshub.in/blog/${slug}` : "https://www.sidshub.in/blog";
      },
    },
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
  },
  hooks: {
    afterRead: [addContentMarkdown],
    afterChange: [triggerDokployRedeploy],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    slugField({ fieldToUse: "title" }),
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
      name: "publishedAt",
      type: "date",
      required: false,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: ["draft", "scheduled", "published"],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "scheduledAt",
      type: "date",
      required: false,
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
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
    {
      name: "featureOnHome",
      type: "checkbox",
      defaultValue: false,
    },
    seoOverridesField,
  ],
};
