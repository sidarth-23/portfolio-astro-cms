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
      defaultValue: "Hey there 👋",
    },
    {
      name: "name",
      type: "text",
      required: true,
      defaultValue: "I'm Sidarth G",
    },
    {
      name: "role",
      type: "text",
      required: true,
      defaultValue: "Full Stack Developer",
    },
    {
      name: "about",
      type: "textarea",
      required: true,
    },
    {
      name: "ctaPrimaryLabel",
      type: "text",
      required: true,
      defaultValue: "Let's connect!",
    },
    {
      name: "ctaPrimaryUrl",
      type: "text",
      required: true,
      defaultValue: "https://linkedin.com/in/sidarth-g",
    },
    {
      name: "ctaSecondaryLabel",
      type: "text",
      required: true,
      defaultValue: "View My CV",
    },
    {
      name: "ctaSecondaryUrl",
      type: "text",
      required: true,
      defaultValue: "/cv",
    },
    {
      name: "latestBlogTitle",
      type: "text",
      required: true,
      defaultValue: "Latest from blog",
    },
  ],
};
