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
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "subtitle",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "experience",
              type: "array",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "subtitle",
                  type: "text",
                  required: true,
                },
                {
                  name: "items",
                  type: "array",
                  fields: [
                    {
                      name: "value",
                      type: "text",
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Settings",
          fields: [
            {
              name: "certifications",
              type: "array",
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                },
                {
                  name: "url",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "skills",
              type: "array",
              fields: [
                {
                  name: "value",
                  type: "text",
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
