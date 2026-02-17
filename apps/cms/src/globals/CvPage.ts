import type { Field, GlobalConfig } from "payload";

const sectionItemFields: Field[] = [
  {
    name: "title",
    type: "text",
    required: true,
  },
  {
    name: "subtitle",
    type: "text",
  },
  {
    name: "content",
    type: "richText",
  },
];

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
              name: "sections",
              type: "array",
              required: true,
              minRows: 1,
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                },
                {
                  name: "type",
                  type: "select",
                  required: true,
                  defaultValue: "description",
                  options: ["description", "items", "badges"],
                },
                {
                  name: "description",
                  type: "richText",
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === "description",
                  },
                },
                {
                  name: "itemsVariant",
                  type: "select",
                  required: true,
                  defaultValue: "list",
                  options: ["timeline", "list", "columns"],
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === "items",
                  },
                },
                {
                  name: "items",
                  type: "array",
                  minRows: 1,
                  fields: sectionItemFields,
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === "items",
                  },
                },
                {
                  name: "badges",
                  type: "array",
                  minRows: 1,
                  fields: [
                    {
                      name: "value",
                      type: "text",
                      required: true,
                    },
                  ],
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === "badges",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
