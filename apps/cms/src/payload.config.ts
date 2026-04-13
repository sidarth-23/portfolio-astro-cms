import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { s3Storage } from "@payloadcms/storage-s3";
import { createCmsConfig } from "@sidshub/cms-config/builder";
import { migrationDir } from "@sidshub/cms-config/migrations-dir";

import { env } from "./env";
import { ensureS3BucketExists } from "./lib/ensureS3Bucket";

const isLocalEndpoint = (endpoint?: string): boolean => {
  if (!endpoint) return false;
  return endpoint.includes("localhost") || endpoint.includes("127.0.0.1");
};

const shouldAutoCreateBucket = (): boolean => {
  if (env.S3_AUTO_CREATE_BUCKET === "true") return true;
  if (env.S3_AUTO_CREATE_BUCKET === "false") return false;
  return env.NODE_ENV !== "production" && isLocalEndpoint(env.S3_ENDPOINT);
};

export default createCmsConfig({
  secret: env.PAYLOAD_SECRET,
  serverURL: env.PAYLOAD_PUBLIC_SERVER_URL,
  readAccessToken: env.CMS_READ_TOKEN,
  db: postgresAdapter({
    migrationDir,
    pool: { connectionString: env.DATABASE_URI },
    push: env.PAYLOAD_DB_PUSH === "true",
  }),
  email: resendAdapter({
    apiKey: env.RESEND_API_KEY,
    defaultFromAddress: env.EMAIL_FROM_ADDRESS,
    defaultFromName: env.EMAIL_FROM_NAME,
  }),
  storagePlugins: [
    s3Storage({
      collections: { media: true },
      bucket: env.S3_BUCKET,
      config: {
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
      },
    }),
  ],
  deployHook:
    env.WEB_DEPLOY_WEBHOOK_URL && env.WEB_DEPLOY_BRANCH
      ? { webhookUrl: env.WEB_DEPLOY_WEBHOOK_URL, branch: env.WEB_DEPLOY_BRANCH }
      : undefined,
  devRefreshUrl: env.WEB_DEV_REFRESH_URL,
  onInit: async () => {
    if (env.S3_ENDPOINT && shouldAutoCreateBucket()) {
      await ensureS3BucketExists({
        bucket: env.S3_BUCKET,
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      });
    }
  },
});
