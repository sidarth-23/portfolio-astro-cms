import type { Field } from "payload";

export const seoOverridesField: Field = {
  type: "group",
  name: "seoOverrides",
  label: "SEO Overrides",
  fields: [
    {
      name: "canonicalUrl",
      type: "text",
      label: "Canonical URL",
    },
    {
      name: "robotsIndex",
      type: "checkbox",
      defaultValue: true,
      label: "Allow Indexing",
    },
    {
      name: "robotsFollow",
      type: "checkbox",
      defaultValue: true,
      label: "Allow Follow",
    },
    {
      name: "schemaType",
      type: "select",
      defaultValue: "Article",
      options: ["Article", "TechArticle"],
    },
  ],
};
