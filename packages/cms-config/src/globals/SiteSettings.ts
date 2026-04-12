import type { GlobalConfig } from "payload";

import { resumeLinkFields } from "../fields/resumeLink";
import { readAccess } from "../access/readAccess";
import { normalizeFooterItemType, validateAndSanitizeFooterItem } from "../client-core/footerLinks";
import { FOOTER_ITEM_KIND, FOOTER_ITEM_KIND_CONFIG, SITE_FOOTER_ITEM_OPTIONS } from "../site-settings/footerItems";

const normalizeSidebarFooterItems = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item, index) => {
    const result = validateAndSanitizeFooterItem(item);
    if (!result.success) {
      throw new Error(`sidebarFooterItems row ${index + 1}: ${result.error}`);
    }

    return {
      ...result.data,
      email: result.data.type === "email" ? result.data.email : undefined,
    };
  });
};

const footerItemKind = (value: unknown) => {
  const type = normalizeFooterItemType(value);
  return type ? FOOTER_ITEM_KIND[type] : undefined;
};

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
      ({ data }) => {
        if (!data || typeof data !== "object") {
          return data;
        }

        return {
          ...data,
          sidebarFooterItems: normalizeSidebarFooterItems(
            (data as { sidebarFooterItems?: unknown }).sidebarFooterItems,
          ),
        };
      },
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
          RowLabel: "./components/admin/rowLabels/FooterItemRowLabel#FooterItemRowLabel",
        },
      },
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          options: SITE_FOOTER_ITEM_OPTIONS.map((option) => ({ ...option })),
        },
        {
          name: "url",
          type: "text",
          required: false,
          label: "URL",
          admin: {
            condition: (_, siblingData) => {
              return footerItemKind(siblingData?.type) === "url";
            },
            description: FOOTER_ITEM_KIND_CONFIG.url.inputDescription,
          },
          validate: (value: unknown, { siblingData }: { siblingData?: { type?: unknown } }) => {
            const type = normalizeFooterItemType(siblingData?.type);
            if (!type) {
              return "Select a valid link type.";
            }

            if (FOOTER_ITEM_KIND[type] !== "url") {
              return true;
            }

            const result = validateAndSanitizeFooterItem({
              type,
              url: value,
              email: (siblingData as { email?: unknown } | undefined)?.email,
            });
            if (result.success) {
              return true;
            }

            return result.error;
          },
        },
        {
          name: "email",
          type: "text",
          required: false,
          label: FOOTER_ITEM_KIND_CONFIG.email.inputLabel,
          admin: {
            condition: (_, siblingData) => footerItemKind(siblingData?.type) === "email",
            description: FOOTER_ITEM_KIND_CONFIG.email.inputDescription,
          },
          validate: (value: unknown, { siblingData }: { siblingData?: { type?: unknown } }) => {
            const type = normalizeFooterItemType(siblingData?.type);
            if (!type || FOOTER_ITEM_KIND[type] !== "email") {
              return true;
            }

            const result = validateAndSanitizeFooterItem({
              type,
              email: value,
              url: (siblingData as { url?: unknown } | undefined)?.url,
            });
            if (result.success) {
              return true;
            }

            return result.error;
          },
        },
      ],
    },
  ],
};
