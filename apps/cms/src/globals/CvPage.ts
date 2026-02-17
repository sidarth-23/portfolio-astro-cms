import type { GlobalConfig } from "payload";

export const CvPage: GlobalConfig = {
  slug: "cv-page",
  label: "CV Page",
  access: {
    read: () => true,
  },
  admin: {
    group: "Pages",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "profile",
              type: "richText",
              required: true,
            },
            {
              name: "education",
              type: "array",
              fields: [
                {
                  name: "key",
                  type: "text",
                  required: true,
                },
                {
                  name: "summary",
                  type: "text",
                },
                {
                  name: "content",
                  type: "richText",
                  required: true,
                },
              ],
            },
            {
              name: "experience",
              type: "array",
              fields: [
                {
                  name: "key",
                  type: "text",
                  required: true,
                },
                {
                  name: "summary",
                  type: "text",
                },
                {
                  name: "content",
                  type: "richText",
                  required: true,
                },
              ],
            },
            {
              name: "certifications",
              type: "array",
              fields: [
                {
                  name: "key",
                  type: "text",
                  required: true,
                },
                {
                  name: "summary",
                  type: "text",
                },
                {
                  name: "content",
                  type: "richText",
                  required: true,
                },
              ],
            },
            {
              name: "skills",
              type: "array",
              fields: [
                {
                  name: "key",
                  type: "text",
                  required: true,
                },
                {
                  name: "summary",
                  type: "text",
                },
                {
                  name: "content",
                  type: "richText",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
