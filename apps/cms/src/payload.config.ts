import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { resendAdapter } from "@payloadcms/email-resend";
import { s3Storage } from "@payloadcms/storage-s3";
import { createCmsConfig } from "@sidshub/cms-core/builder";

import { env } from "./env";

const mediaStorageOptions = {
  generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) => {
    const objectKey = [prefix, encodeURIComponent(filename)].filter(Boolean).join("/");

    return new URL(objectKey, env.S3_PUBLIC_URL).toString();
  },
};

function buildStoragePlugins() {
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

export default createCmsConfig({
  secret: env.PAYLOAD_SECRET,
  serverURL: env.PAYLOAD_PUBLIC_SERVER_URL,
  siteUrl: env.ASTRO_SITE_URL,
  db: mongooseAdapter({
    url: env.DATABASE_URI,
  }),
  email: resendAdapter({
    apiKey: env.RESEND_API_KEY,
    defaultFromAddress: env.EMAIL_FROM_ADDRESS,
    defaultFromName: env.EMAIL_FROM_NAME,
  }),
  storagePlugins: buildStoragePlugins(),
});
