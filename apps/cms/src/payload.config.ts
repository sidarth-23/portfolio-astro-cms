import path from "path";
import { fileURLToPath } from "url";

import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
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
const s3Bucket = process.env.S3_BUCKET || "sidshub-media";
const s3Region = process.env.S3_REGION || "us-east-1";
const s3Endpoint = process.env.S3_ENDPOINT;
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";

const isLocalEndpoint = (endpoint?: string): boolean => {
  if (!endpoint) {
    return false;
  }

  return endpoint.includes("localhost") || endpoint.includes("127.0.0.1");
};

const shouldAutoCreateBucket = (): boolean => {
  const explicitValue = process.env.S3_AUTO_CREATE_BUCKET;
  if (explicitValue === "true") {
    return true;
  }
  if (explicitValue === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production" && isLocalEndpoint(s3Endpoint);
};

const isNoSuchBucketError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & { name?: string; Code?: string };
  return candidate.name === "NotFound" || candidate.name === "NoSuchBucket" || candidate.Code === "NoSuchBucket";
};

const ensureS3BucketExists = async (): Promise<void> => {
  if (!s3Endpoint || !shouldAutoCreateBucket()) {
    return;
  }

  const s3Client = new S3Client({
    forcePathStyle: true,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
    endpoint: s3Endpoint,
    region: s3Region,
  });

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: s3Bucket }));
  } catch (error) {
    if (!isNoSuchBucketError(error)) {
      throw error;
    }

    await s3Client.send(new CreateBucketCommand({ Bucket: s3Bucket }));
  }
};

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
  onInit: async () => {
    await ensureS3BucketExists();
  },
  plugins: [
    seoPlugin({
      collections: ["posts", "projects", "categories"],
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
      bucket: s3Bucket,
      config: {
        forcePathStyle: true,
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
        endpoint: s3Endpoint,
        region: s3Region,
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
