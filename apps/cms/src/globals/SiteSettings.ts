import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: () => true,
  },
  admin: {
    group: "Site",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "siteTitle",
              type: "text",
              required: true,
            },
            {
              name: "siteDescription",
              type: "textarea",
              required: true,
            },
            {
              name: "defaultOgImage",
              type: "upload",
              relationTo: "media",
              required: false,
            },
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
          required: true,
          validate: (value: unknown) => {
            if (typeof value === "string" && value.trim().length > 0) {
              return true;
            }

            return "URL is required for footer items.";
          },
        },
      ],
    },
  ],
};
