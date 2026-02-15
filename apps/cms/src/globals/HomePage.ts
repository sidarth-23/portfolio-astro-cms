import type { GlobalConfig } from "payload";

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "greeting",
      type: "text",
      required: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "text",
      required: true,
    },
    {
      name: "about",
      type: "richText",
      required: true,
    },
    {
      name: "ctaPrimaryLabel",
      type: "text",
      required: true,
    },
    {
      name: "ctaPrimaryUrl",
      type: "text",
      required: true,
    },
    {
      name: "ctaSecondaryLabel",
      type: "text",
      required: true,
    },
    {
      name: "ctaSecondaryUrl",
      type: "text",
      required: true,
    },
    {
      name: "latestBlogTitle",
      type: "text",
      required: true,
    },
  ],
};
