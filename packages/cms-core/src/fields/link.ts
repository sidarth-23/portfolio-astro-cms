import type { Field } from "payload";
import { LINK_TYPE_OPTIONS, PAGE_ROUTE_OPTIONS } from "@/lib/content";
import { iconPickerField } from "@sidshub/cms-lib-icons";

export type LinkVariant = "link-only" | "icon-only" | "text-only" | "icon-with-text";

export type LinkFieldArgs = {
  name?: string;
  label?: string;
  variant?: LinkVariant;
};

export const linkFields = ({
  variant = "link-only",
}: Omit<LinkFieldArgs, "name" | "label"> = {}): Field[] => {
  const fields: Field[] = [];

  // 1. Icon field (if icon-only or icon-with-text)
  if (variant === "icon-only" || variant === "icon-with-text") {
    fields.push(iconPickerField({ name: "icon", label: "Icon" }));
  }

  // 2. Label text field (if text-only or icon-with-text)
  if (variant === "text-only" || variant === "icon-with-text") {
    fields.push({
      name: "label",
      type: "text",
      required: true,
    });
  }

  // 3. Type radio — horizontal layout
  fields.push({
    name: "type",
    type: "radio",
    defaultValue: "custom",
    options: LINK_TYPE_OPTIONS,
    admin: {
      layout: "horizontal",
    },
  });

  // 4. URL text field (conditional: type === "custom")
  fields.push({
    name: "url",
    type: "text",
    required: true,
    admin: {
      condition: (_, siblingData) => siblingData?.type === "custom",
    },
  });

  // 5. Reference relationship (conditional: type === "reference")
  fields.push({
    name: "reference",
    type: "relationship",
    relationTo: ["posts", "projects", "series"],
    required: true,
    admin: {
      allowCreate: false,
      condition: (_, siblingData) => siblingData?.type === "reference",
    },
  });

  // 6. Page select (conditional: type === "page")
  fields.push({
    name: "page",
    type: "select",
    options: PAGE_ROUTE_OPTIONS,
    required: true,
    admin: {
      condition: (_, siblingData) => siblingData?.type === "page",
    },
  });

  // 7. NewTab checkbox
  fields.push({
    name: "newTab",
    type: "checkbox",
    label: "Open in new tab",
  });

  return fields;
};

export const linkField = ({
  name = "link",
  label = "Link",
  variant = "link-only",
}: LinkFieldArgs = {}): Field => {
  return {
    name,
    label,
    type: "group",
    fields: linkFields({ variant }),
  };
};
