import type { AllowList, CollectionConfig } from "payload";
import { createMinimalRichTextEditor } from "@/lib/editor";

export const mediaPasteUrlAllowList: AllowList = [
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
  { hostname: "github.com", protocol: "https" },
  { hostname: "octodex.github.com", protocol: "https" },
  { hostname: "raw.githubusercontent.com", protocol: "https" },
  { hostname: "user-images.githubusercontent.com", protocol: "https" },
  { hostname: "avatars.githubusercontent.com", protocol: "https" },
  { hostname: "img.shields.io", protocol: "https" },
  { hostname: "shields.io", protocol: "https" },
];

export const Media: CollectionConfig = {
  slug: "media",
  folders: true,
  upload: {
    mimeTypes: ["image/*"],
    imageSizes: [
      {
        name: "heroLg",
        width: 1280,
        height: 720,
        fit: "cover",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 82 } },
      },
      {
        name: "heroMd",
        width: 768,
        height: 432,
        fit: "cover",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
      {
        name: "heroSm",
        width: 480,
        height: 270,
        fit: "cover",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 78 } },
      },
      {
        name: "large",
        width: 1200,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 82 } },
      },
      {
        name: "medium",
        width: 768,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 80 } },
      },
      {
        name: "card",
        width: 480,
        height: 320,
        fit: "cover",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 78 } },
      },
      {
        name: "thumbnail",
        width: 200,
        height: 200,
        fit: "cover",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 75 } },
      },
    ],
    adminThumbnail: "thumbnail",
    resizeOptions: {
      width: 2400,
      fit: "inside",
    },
    focalPoint: true,
    crop: true,
    pasteURL: {
      allowList: mediaPasteUrlAllowList,
    },
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "alt",
    group: "Assets",
    components: {
      beforeListTable: ["./components/admin/OrphanedMediaDrawer#OrphanedMediaDrawer"],
    },
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
