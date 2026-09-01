import { seoPlugin } from "@payloadcms/plugin-seo";
import {
  convertMarkdownEndpoint,
  importMediaFromUrlEndpoint,
} from "@cms/lib/editor/features/markdown-paste/endpoints";
import { collectionOverride, globalOverride, ogImagePlugin } from "@cms/plugins/og-image";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { resendAdapter } from "@payloadcms/email-resend";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
import type { CollectionConfig, GlobalConfig, Plugin } from "payload";

import { Categories } from "@cms/collections/Categories";
import { Media } from "@cms/collections/Media";
import { Posts } from "@cms/collections/Posts";
import { Projects } from "@cms/collections/Projects";
import { Series } from "@cms/collections/Series";
import { Users } from "@cms/collections/Users";
import { orphanedMediaEndpoints } from "@cms/endpoints/orphanedMedia";
import { BlogPage } from "@cms/globals/BlogPage";
import { CvPage } from "@cms/globals/CvPage";
import { HomePage } from "@cms/globals/HomePage";
import { ProjectsPage } from "@cms/globals/ProjectsPage";
import { SeriesPage } from "@cms/globals/SeriesPage";
import { SiteSettings } from "@cms/globals/SiteSettings";
import { createBasicRichTextEditor } from "@cms/lib/editor";
import { SEO_COLLECTIONS, SEO_GLOBALS } from "@cms/registry";
import type {
  BlogPage as BlogPageType,
  CvPage as CvPageType,
  Post,
  Project,
  ProjectsPage as ProjectsPageType,
  Series as SeriesType,
  SeriesPage as SeriesPageType,
  SiteSetting,
} from "./payload-types";

import { env } from "./env";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const mediaStorageOptions = {
  generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) => {
    const objectKey = [prefix, encodeURIComponent(filename)].filter(Boolean).join("/");

    return new URL(objectKey, env.S3_PUBLIC_URL).toString();
  },
};

function buildStoragePlugins(): Plugin[] {
  return [
    s3Storage({
      collections: { media: mediaStorageOptions },
      bucket: env.S3_BUCKET,
      config: {
        forcePathStyle: Boolean(env.S3_ENDPOINT),
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
      },
    }),
  ];
}

const siteUrl = env.ASTRO_SITE_URL ?? "https://sidshub.in";

// URL mapping: collection/global slug → public-facing URL on the frontend.
const generateURL = ({
  doc,
  collectionSlug,
  globalSlug,
}: {
  doc: Record<string, unknown>;
  collectionSlug?: string;
  globalSlug?: string;
}): string => {
  if (collectionSlug === "posts") return `${siteUrl}/blog/${doc.slug ?? ""}`;
  if (collectionSlug === "projects") return `${siteUrl}/projects/${doc.slug ?? ""}`;
  if (collectionSlug === "series") return `${siteUrl}/blog/series/${doc.slug ?? ""}`;
  if (globalSlug === "site-settings" || globalSlug === "home-page") return siteUrl;
  if (globalSlug === "blog-page" || globalSlug === "series-page") return `${siteUrl}/blog`;
  if (globalSlug === "cv-page") return `${siteUrl}/cv`;
  if (globalSlug === "projects-page") return `${siteUrl}/projects`;
  return siteUrl;
};

const collections: CollectionConfig[] = [Users, Media, Categories, Series, Posts, Projects];
const globals: GlobalConfig[] = [
  SiteSettings,
  HomePage,
  CvPage,
  BlogPage,
  SeriesPage,
  ProjectsPage,
];

export default buildConfig({
  // Experimental in Payload v3 — may change in minor versions until stable.
  folders: {},
  debug: true,
  editor: createBasicRichTextEditor(),
  serverURL: env.PAYLOAD_PUBLIC_SERVER_URL,
  email: resendAdapter({
    apiKey: env.RESEND_API_KEY,
    defaultFromAddress: env.EMAIL_FROM_ADDRESS,
    defaultFromName: env.EMAIL_FROM_NAME,
  }),
  admin: {
    user: Users.slug,
    components: {
      afterNavLinks: ["./components/admin/nav/DashboardNavLink#DashboardNavLink"],
      views: {
        dashboard: {
          Component: "./components/admin/Dashboard#DashboardView",
        },
        setupChecklist: {
          Component: "./components/admin/SetupChecklistView#SetupChecklistView",
          path: "/setup-checklist",
        },
      },
    },
    importMap: {
      baseDir: dirname,
    },
  },
  routes: {
    admin: "/admin",
  },
  endpoints: [importMediaFromUrlEndpoint, convertMarkdownEndpoint, ...orphanedMediaEndpoints],
  collections,
  globals,
  plugins: [
    seoPlugin({
      collections: [...SEO_COLLECTIONS],
      globals: [...SEO_GLOBALS],
      tabbedUI: true,
      uploadsCollection: "media",
      generateURL,
    }),
    ogImagePlugin({
      siteUrl,
      collections: {
        posts: collectionOverride<Post>({
          ogTitle: "title",
          existingImage: "coverImage",
          depth: 1,
          seoFieldMapping: {
            titleField: "title",
            descriptionField: "description",
            imageField: "coverImage",
          },
        }),
        projects: collectionOverride<Project>({
          ogTitle: "title",
          existingImage: "coverImage",
          depth: 1,
          seoFieldMapping: {
            titleField: "title",
            descriptionField: "description",
            imageField: "coverImage",
          },
        }),
        series: collectionOverride<SeriesType>({
          seoFieldMapping: {
            titleField: "name",
            descriptionField: "description",
            imageField: null,
          },
        }),
      },
      globals: {
        "cv-page": globalOverride<CvPageType>({}),
        "blog-page": globalOverride<BlogPageType>({}),
        "series-page": globalOverride<SeriesPageType>({}),
        "projects-page": globalOverride<ProjectsPageType>({}),
        "site-settings": globalOverride<SiteSetting>({}),
      },
    }),
    ...buildStoragePlugins(),
  ],
  db: mongooseAdapter({
    url: env.DATABASE_URI,
  }),
  secret: env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "./payload-types.ts"),
  },
});
