import type { AllowList, CollectionConfig } from "payload";
import { createMinimalRichTextEditor } from "@sidshub/lexical/cms";

const pasteUrlAllowList: AllowList = [
  { hostname: "sidshub.in", protocol: "https" },
  { hostname: "www.sidshub.in", protocol: "https" },
  { hostname: "cms-staging.sidshub.in", protocol: "https" },
  { hostname: "cms.sidshub.in", protocol: "https" },
  { hostname: "images.unsplash.com", protocol: "https" },
  { hostname: "unsplash.com", protocol: "https" },
  { hostname: "cdn.dribbble.com", protocol: "https" },
  { hostname: "dribbble.com", protocol: "https" },
  { hostname: "miro.medium.com", protocol: "https" },
  { hostname: "cdn-images-1.medium.com", protocol: "https" },
  { hostname: "lh3.googleusercontent.com", protocol: "https" },
  { hostname: "lh4.googleusercontent.com", protocol: "https" },
  { hostname: "lh5.googleusercontent.com", protocol: "https" },
  { hostname: "lh6.googleusercontent.com", protocol: "https" },
  { hostname: "storage.googleapis.com", protocol: "https" },
  { hostname: "drive.google.com", protocol: "https" },
  { hostname: "docs.google.com", protocol: "https" },
  { hostname: "raw.githubusercontent.com", protocol: "https" },
  { hostname: "user-images.githubusercontent.com", protocol: "https" },
  { hostname: "avatars.githubusercontent.com", protocol: "https" },
];

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    mimeTypes: ["image/*"],
    pasteURL: {
      allowList: pasteUrlAllowList,
    },
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "alt",
    group: "Assets",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt Text",
    },
    {
      name: "caption",
      type: "richText",
      editor: createMinimalRichTextEditor(),
    },
    {
      name: "sourceUrl",
      type: "text",
      required: false,
      admin: {
        readOnly: true,
        description: "Original remote URL used to import this image.",
      },
    },
  ],
};
