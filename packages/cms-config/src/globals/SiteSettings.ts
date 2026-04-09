import type { GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: readAccess,
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
              name: "profileImage",
              type: "upload",
              relationTo: "media",
              required: false,
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            {
              name: "routeSeo",
              type: "group",
              fields: [
                {
                  name: "blogHome",
                  type: "group",
                  label: "Blog Home",
                  fields: [
                    {
                      name: "title",
                      type: "text",
                      required: true,
                    },
                    {
                      name: "description",
                      type: "textarea",
                      required: true,
                    },
                    {
                      name: "image",
                      type: "upload",
                      relationTo: "media",
                      required: false,
                    },
                  ],
                },
                {
                  name: "blogSeries",
                  type: "group",
                  label: "Blog Series",
                  fields: [
                    {
                      name: "title",
                      type: "text",
                      required: true,
                      admin: {
                        description: "Use {seriesName} to insert the current series name.",
                      },
                    },
                    {
                      name: "description",
                      type: "textarea",
                      required: true,
                      admin: {
                        description: "Use {seriesName} to insert the current series name.",
                      },
                    },
                    {
                      name: "image",
                      type: "upload",
                      relationTo: "media",
                      required: false,
                    },
                  ],
                },
                {
                  name: "notFound",
                  type: "group",
                  label: "404 Page",
                  fields: [
                    {
                      name: "title",
                      type: "text",
                      required: true,
                    },
                    {
                      name: "description",
                      type: "textarea",
                      required: true,
                    },
                    {
                      name: "image",
                      type: "upload",
                      relationTo: "media",
                      required: false,
                    },
                  ],
                },
              ],
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
