import type { CollectionConfig } from "payload";

import { readAccess } from "../access/readAccess";

export const Media: CollectionConfig = {
  slug: "media",
  upload: true,
  access: {
    read: readAccess,
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
