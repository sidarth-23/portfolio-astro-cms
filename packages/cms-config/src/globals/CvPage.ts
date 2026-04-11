import type { Field, GlobalConfig } from "payload";

import { readAccess } from "../access/readAccess";

const sectionItemFields: Field[] = [
  {
    name: "itemType",
    type: "select",
    required: true,
    defaultValue: "generic",
    options: [
      { label: "Generic", value: "generic" },
      {
        label: "Organization Role (e.g. Experience)",
        value: "organizationRole",
      },
      { label: "Linked (e.g. Certificate)", value: "linked" },
    ],
  },
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
    name: "startMonth",
    type: "date",
    admin: {
      condition: (_, siblingData) =>
        siblingData?.itemType === "organizationRole",
      date: {
        pickerAppearance: "monthOnly",
        displayFormat: "MMM yyyy",
      },
    },
  },
  {
    name: "endMonth",
    type: "date",
    admin: {
      condition: (_, siblingData) =>
        siblingData?.itemType === "organizationRole",
      date: {
        pickerAppearance: "monthOnly",
        displayFormat: "MMM yyyy",
      },
    },
  },
  {
    name: "organization",
    type: "text",
    admin: {
      condition: (_, siblingData) =>
        siblingData?.itemType === "organizationRole",
    },
  },
  {
    name: "location",
    type: "text",
    admin: {
      condition: (_, siblingData) =>
        siblingData?.itemType === "organizationRole",
    },
  },
  {
    name: "url",
    type: "text",
    admin: {
      condition: (_, siblingData) => siblingData?.itemType === "linked",
    },
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
    read: readAccess,
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
              admin: {
                components: {
                  RowLabel:
                    "./components/admin/rowLabels/SectionRowLabel#SectionRowLabel",
                },
              },
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
                  options: [
                    { label: "Description", value: "description" },
                    { label: "Items", value: "items" },
                    { label: "Badges", value: "badges" },
                  ],
                },
                {
                  name: "description",
                  type: "richText",
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.type === "description",
                  },
                },
                {
                  name: "itemsVariant",
                  type: "select",
                  required: true,
                  defaultValue: "list",
                  options: [
                    { label: "Timeline", value: "timeline" },
                    { label: "List", value: "list" },
                    { label: "Columns", value: "columns" },
                  ],
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.type === "items",
                  },
                },
                {
                  name: "items",
                  type: "array",
                  minRows: 1,
                  fields: sectionItemFields,
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.type === "items",
                    components: {
                      RowLabel:
                        "./components/admin/rowLabels/ItemRowLabel#ItemRowLabel",
                    },
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
                    condition: (_, siblingData) =>
                      siblingData?.type === "badges",
                    components: {
                      RowLabel:
                        "./components/admin/rowLabels/BadgeRowLabel#BadgeRowLabel",
                    },
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
