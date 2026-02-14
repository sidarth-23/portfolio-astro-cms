import type { GlobalConfig } from "payload";

export const CvPage: GlobalConfig = {
  slug: "cv-page",
  label: "CV Page",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "profile",
      type: "textarea",
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
};
