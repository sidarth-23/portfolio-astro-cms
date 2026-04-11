import path from "path";
import { fileURLToPath } from "url";

import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { defaultLexicalEditor } from "@sidshub/lexical/cms";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import type { CollectionConfig, Field, GlobalConfig } from "payload";

import { Categories } from "./collections/Categories";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Projects } from "./collections/Projects";
import { Series } from "./collections/Series";
import { Tags } from "./collections/Tags";
import { Users } from "./collections/Users";
import { CvPage } from "./globals/CvPage";
import { HomePage } from "./globals/HomePage";
import { BlogPage } from "./globals/BlogPage";
import { NotFoundPage } from "./globals/NotFoundPage";
import { ProjectsPage } from "./globals/ProjectsPage";
import { SeriesPage } from "./globals/SeriesPage";
import { SiteSettings } from "./globals/SiteSettings";
import { triggerCollectionRedeploy } from "./hooks/triggerCollectionRedeploy";
import { triggerGlobalRedeploy } from "./hooks/triggerGlobalRedeploy";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const s3Bucket = process.env.S3_BUCKET || "sidshub-media";
const s3Region = process.env.S3_REGION || "us-east-1";
const s3Endpoint = process.env.S3_ENDPOINT;
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || "";
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const payloadSecret = getRequiredEnv("PAYLOAD_SECRET");
const payloadPublicServerURL = getRequiredEnv("PAYLOAD_PUBLIC_SERVER_URL");
const resendApiKey = getRequiredEnv("RESEND_API_KEY");
const emailFromAddress = getRequiredEnv("EMAIL_FROM_ADDRESS");
const emailFromName = getRequiredEnv("EMAIL_FROM_NAME");

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

const shouldPushDbSchema = (): boolean => {
  return process.env.PAYLOAD_DB_PUSH === "true";
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

const withCollectionAfterChangeHook = (collection: CollectionConfig): CollectionConfig => {
  const existingAfterChange = collection.hooks?.afterChange ?? [];

  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [...existingAfterChange, triggerCollectionRedeploy],
    },
  };
};

const withGlobalAfterChangeHook = (globalConfig: GlobalConfig): GlobalConfig => {
  const existingAfterChange = globalConfig.hooks?.afterChange ?? [];

  return {
    ...globalConfig,
    hooks: {
      ...globalConfig.hooks,
      afterChange: [...existingAfterChange, triggerGlobalRedeploy],
    },
  };
};

const collections: CollectionConfig[] = [Users, Media, Categories, Tags, Series, Posts, Projects].map(
  withCollectionAfterChangeHook,
);
const globals: GlobalConfig[] = [SiteSettings, HomePage, CvPage, BlogPage, SeriesPage, ProjectsPage, NotFoundPage].map(
  withGlobalAfterChangeHook,
);

const withRequiredSeoFields = ({ defaultFields }: { defaultFields: Field[] }): Field[] => {
  return defaultFields.map((field) => {
    if ("name" in field && (field.name === "title" || field.name === "description")) {
      return {
        ...field,
        required: true,
      };
    }

    return field;
  });
};

export default buildConfig({
  editor: defaultLexicalEditor,
  serverURL: payloadPublicServerURL,
  email: resendAdapter({
    apiKey: resendApiKey,
    defaultFromAddress: emailFromAddress,
    defaultFromName: emailFromName,
  }),
  admin: {
    user: Users.slug,
    components: {
      views: {
        dashboard: {
          Component: "./components/admin/Dashboard#DashboardView",
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  routes: {
    admin: "/",
  },
  collections,
  globals,
  onInit: async () => {
    await ensureS3BucketExists();
  },
  plugins: [
    seoPlugin({
      collections: ["posts", "series"],
      globals: ["home-page", "cv-page", "blog-page", "series-page", "projects-page", "not-found-page"],
      tabbedUI: true,
      uploadsCollection: "media",
      fields: withRequiredSeoFields,
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
    migrationDir: path.resolve(dirname, "migrations"),
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
    push: shouldPushDbSchema(),
  }),
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
