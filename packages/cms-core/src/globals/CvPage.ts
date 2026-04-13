import type { Field, GlobalConfig } from "payload";
import { createBasicRichTextEditor } from "@sidshub/cms-editor/cms";

import { readAccess } from "../access/readAccess";
import { iconPickerField } from "../fields/iconPicker";
import {
  CV_ITEMS_VARIANT_OPTIONS,
  CV_SECTION_ITEM_TYPE_OPTIONS,
  CV_SECTION_TYPE_OPTIONS,
} from "../lib/options/cv";
import { sanitizeCvPageBeforeValidate } from "../lib/validation/cvPageSanitizer";
import { createPayloadDataSchemaHook } from "../lib/validation/payloadSchema";
import { cvPageSchema } from "../lib/validation/schemas";

const sectionItemFields: Field[] = [
  {
    name: "itemType",
    type: "select",
    required: true,
    defaultValue: "generic",
    options: CV_SECTION_ITEM_TYPE_OPTIONS,
  },
  {
    name: "title",
    type: "text",
    required: true,
  },
  {
    name: "subtitle",
    type: "text",
    admin: {
      condition: (_, siblingData) =>
        siblingData?.itemType === "generic" || !siblingData?.itemType,
    },
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
    editor: createBasicRichTextEditor(),
  },
];

const badgeFields: Field[] = [
  {
    name: "value",
    type: "text",
    required: true,
  },
  iconPickerField(),
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
  hooks: {
    beforeValidate: [
      sanitizeCvPageBeforeValidate,
      createPayloadDataSchemaHook(cvPageSchema, {
        errorPrefix: "CV page validation failed:",
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
                  options: CV_SECTION_TYPE_OPTIONS,
                },
                {
                  name: "description",
                  type: "richText",
                  editor: createBasicRichTextEditor(),
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
                  options: CV_ITEMS_VARIANT_OPTIONS,
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
                  name: "badgeGroups",
                  type: "array",
                  minRows: 1,
                  fields: [
                    {
                      name: "title",
                      type: "text",
                      required: true,
                    },
                    {
                      name: "badges",
                      type: "array",
                      minRows: 1,
                      fields: badgeFields,
                      admin: {
                        components: {
                          RowLabel:
                            "./components/admin/rowLabels/BadgeRowLabel#BadgeRowLabel",
                        },
                      },
                    },
                  ],
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.type === "badges",
                    components: {
                      RowLabel:
                        "./components/admin/rowLabels/BadgeGroupRowLabel#BadgeGroupRowLabel",
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
