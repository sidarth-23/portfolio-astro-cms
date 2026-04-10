import type { GlobalConfig } from "payload";

import { resumeLinkFields } from "../fields/resumeLink";
import { readAccess } from "../access/readAccess";
import { getFooterLinkRule, normalizeFooterItemType, resolveFooterLink } from "../client-core/footerLinks";

const normalizeSidebarFooterItems = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => {
    if (!item || typeof item !== "object") {
      return item;
    }

    const typedItem = item as { type?: unknown; url?: unknown };
    const type = normalizeFooterItemType(typedItem.type);
    if (!type) {
      return item;
    }

    const rawValue =
      type === "email"
        ? typeof (typedItem as { email?: unknown }).email === "string"
          ? String((typedItem as { email?: unknown }).email)
          : ""
        : typeof typedItem.url === "string"
          ? typedItem.url
          : "";
    const resolved = resolveFooterLink(type, rawValue);
    if (!resolved) {
      return item;
    }

    return {
      ...item,
      type,
      url: resolved.url,
    };
  });
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
          options: [
            { label: "GitHub", value: "github" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Email", value: "email" },
            { label: "RSS", value: "rss" },
            { label: "Facebook", value: "facebook" },
            { label: "Twitter", value: "twitter" },
            { label: "Dribbble", value: "dribbble" },
            { label: "Instagram", value: "instagram" },
            { label: "YouTube", value: "youtube" },
            { label: "Twitch", value: "twitch" },
            { label: "TikTok", value: "tiktok" },
            { label: "Medium", value: "medium" },
            { label: "WhatsApp", value: "whatsapp" },
            { label: "Telegram", value: "telegram" },
            { label: "Discord", value: "discord" },
            { label: "Reddit", value: "reddit" },
            { label: "Pinterest", value: "pinterest" },
            { label: "Behance", value: "behance" },
            { label: "CodePen", value: "codepen" },
            { label: "GitLab", value: "gitlab" },
            { label: "Stack Overflow", value: "stackoverflow" },
            { label: "dev.to", value: "devto" },
          ],
        },
        {
          name: "url",
          type: "text",
          required: false,
          label: "URL",
          admin: {
            condition: (_, siblingData) => {
              const type = normalizeFooterItemType(siblingData?.type);
              return Boolean(type && type !== "rss" && type !== "email");
            },
            description: getFooterLinkRule("github").inputDescription,
          },
          validate: (value: unknown, { siblingData }: { siblingData?: { type?: unknown } }) => {
            const type = normalizeFooterItemType(siblingData?.type);
            if (!type) {
              return "Select a link type first.";
            }

            if (type === "rss" || type === "email") {
              return true;
            }

            const rawValue = typeof value === "string" ? value : "";
            const resolved = resolveFooterLink(type, rawValue);
            if (resolved) {
              return true;
            }

            return "Enter a valid URL that starts with https:// or http://.";
          },
        },
        {
          name: "email",
          type: "text",
          required: false,
          label: getFooterLinkRule("email").inputLabel,
          admin: {
            condition: (_, siblingData) => normalizeFooterItemType(siblingData?.type) === "email",
            description: getFooterLinkRule("email").inputDescription,
          },
          validate: (value: unknown, { siblingData }: { siblingData?: { type?: unknown } }) => {
            const type = normalizeFooterItemType(siblingData?.type);
            if (type !== "email") {
              return true;
            }

            const rawValue = typeof value === "string" ? value : "";
            const resolved = resolveFooterLink("email", rawValue);
            if (resolved) {
              return true;
            }

            return "Enter a valid email address, for example name@example.com.";
          },
        },
      ],
    },
  ],
};
