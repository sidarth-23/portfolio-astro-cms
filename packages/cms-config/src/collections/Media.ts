import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: true,
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "alt",
    group: "Assets",
  },
  fields: [

    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text",
    },
    {
      name: "caption",
      type: "richText",
    },
  ],
};
