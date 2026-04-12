import type { Field } from "payload";
import { LINK_TYPE_OPTIONS } from "../lib/options/link";

type LinkFieldArgs = {
  name?: string;
  label?: string;
};

export const linkField = ({ name = "link", label = "Link" }: LinkFieldArgs = {}): Field => {
  return {
    name,
    label,
    type: "group",
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "type",
            type: "radio",
            defaultValue: "custom",
            options: LINK_TYPE_OPTIONS,
            admin: {
              width: "50%",
              layout: "horizontal",
            },
          },
          {
            name: "newTab",
            type: "checkbox",
            label: "Open in new tab",
            admin: {
              width: "50%",
              style: {
                alignSelf: "flex-end",
              },
            },
          },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "url",
            type: "text",
            required: true,
            admin: {
              width: "50%",
              condition: (_, siblingData) => siblingData?.type === "custom",
            },
          },
          {
            name: "reference",
            type: "relationship",
            relationTo: ["posts", "projects"],
            required: true,
            admin: {
              width: "50%",
              condition: (_, siblingData) => siblingData?.type === "reference",
            },
          },
        ],
      },
    ],
  };
};
