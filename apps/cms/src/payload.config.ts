import path from "path";
import { fileURLToPath } from "url";

import { defaultLexicalEditor } from "@sidshub/lexical/cms";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";

import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Projects } from "./collections/Projects";
import { Series } from "./collections/Series";
import { Tags } from "./collections/Tags";
import { Users } from "./collections/Users";
import { CvPage } from "./globals/CvPage";
import { HomePage } from "./globals/HomePage";
import { ProjectsPage } from "./globals/ProjectsPage";
import { SiteSettings } from "./globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000";

export default buildConfig({
  editor: defaultLexicalEditor,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Tags, Series, Posts, Projects],
  globals: [SiteSettings, HomePage, CvPage, ProjectsPage],
  plugins: [
    seoPlugin({
      collections: ["posts", "projects"],
      globals: ["site-settings", "home-page", "cv-page", "projects-page"],
      uploadsCollection: "media",
      generateTitle: ({ doc }) => {
        if (typeof doc?.title === "string") {
          return `${doc.title} | Sidarth`;
        }
        if (typeof doc?.name === "string") {
          return `${doc.name} | Sidarth`;
        }
        return "Sidarth";
      },
      generateDescription: ({ doc }) => {
        return doc?.excerpt || doc?.summary || doc?.description || "";
      },
      generateURL: ({ doc, collectionSlug, globalSlug }) => {
        if (globalSlug) {
          return `${serverURL}/${globalSlug}`;
        }

        if (collectionSlug === "posts") {
          return `${serverURL}/blog/${doc?.slug}`;
        }

        if (collectionSlug === "projects") {
          return `${serverURL}/projects#${doc?.slug}`;
        }

        return serverURL;
      },
    }),
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || "sidshub-media",
      config: {
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "us-east-1",
      },
    }),
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "../../../packages/cms-types/src/payload-types.ts"),
  },
});
