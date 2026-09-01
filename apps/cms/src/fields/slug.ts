import { createSlug } from "@cms/lib/content";
import type { Field } from "payload";

type SlugFieldOptions = {
  fieldToUse: string;
};

export const slugField = ({ fieldToUse }: SlugFieldOptions): Field => ({
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    description: "Auto-generated from title, but can be edited.",
  },
  hooks: {
    beforeValidate: [
      ({ data, value }) => {
        if (typeof value === "string" && value.length > 0) {
          return createSlug(value);
        }

        const fallback = data?.[fieldToUse];
        if (typeof fallback === "string") {
          return createSlug(fallback);
        }

        return value;
      },
    ],
  },
});
