import type { CollectionConfig } from "payload";

import { triggerDokployRedeploy } from "../hooks/triggerDokployRedeploy";
import { seoOverridesField } from "../fields/seoOverrides";
import { slugField } from "../fields/slug";

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "section", "displayOrder", "updatedAt"],
  },
  hooks: {
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
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "description",
      type: "richText",
      required: false,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: false,
    },
    {
      name: "externalUrl",
      type: "text",
      required: true,
    },
    {
      name: "badge",
      type: "text",
      required: false,
    },
    {
      name: "techTags",
      type: "array",
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "section",
      type: "select",
      required: true,
      defaultValue: "featured",
      options: ["featured", "newbie"],
    },
    {
      name: "displayOrder",
      type: "number",
      defaultValue: 0,
      required: true,
    },
    {
      name: "isVisible",
      type: "checkbox",
      defaultValue: true,
    },
    seoOverridesField,
  ],
};
