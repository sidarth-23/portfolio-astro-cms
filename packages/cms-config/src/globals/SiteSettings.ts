import type { GlobalConfig } from "payload";

import { resumeLinkFields } from "../fields/resumeLink";
import { linkFields } from "../fields/link";
import { readAccess } from "../access/readAccess";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { siteSettingsSchema } from "../lib/validation/schemas";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: readAccess,
  },
  admin: {
    group: "Site",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(siteSettingsSchema, { errorPrefix: "Site Settings validation failed:" }),
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
              name: "profileImage",
              type: "upload",
              relationTo: "media",
              required: false,
            },
            ...resumeLinkFields,
          ],
        },
      ],
    },
    {
      name: "sidebarFooterItems",
      type: "array",
      required: false,
      maxRows: 4,
      admin: {
        position: "sidebar",
        components: {
          RowLabel: "./components/admin/rowLabels/LinkRowLabel#LinkRowLabel",
        },
      },
      fields: linkFields({ variant: "icon-only" }),
    },
  ],
};
