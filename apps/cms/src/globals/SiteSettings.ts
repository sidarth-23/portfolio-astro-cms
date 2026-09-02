import type { GlobalConfig } from "payload";

import { resumeLinkFields } from "@cms/fields/resumeLink";
import { linkFields } from "@cms/fields/link";
import { adminAccess, publicReadAccess } from "@cms/access/readAccess";
import { createPayloadDataSchemaHook, siteSettingsSchema } from "@cms/lib/validation";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: publicReadAccess,
    create: adminAccess,
    update: adminAccess,
    delete: adminAccess,
  },
  admin: {
    group: "Site",
  },
  hooks: {
    beforeValidate: [
      createPayloadDataSchemaHook(siteSettingsSchema, {
        errorPrefix: "Site Settings validation failed:",
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
              name: "name",
              type: "text",
              required: true,
              admin: { description: "Display name shown in the sidebar profile." },
            },
            {
              name: "role",
              type: "text",
              required: true,
              admin: { description: "Role/title shown below the name in the sidebar." },
            },
            {
              name: "profileImage",
              type: "upload",
              relationTo: "media",
              required: true,
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
