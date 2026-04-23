import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { resendAdapter } from "@payloadcms/email-resend";
import { s3Storage } from "@payloadcms/storage-s3";
import { createCmsConfig } from "@sidshub/cms-core/builder";

import { env } from "./env";

function buildStoragePlugins() {
  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    return [];
  }

  return [
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
  ];
}

function buildDeploymentLogView(): Parameters<typeof createCmsConfig>[0]["deploymentLogView"] {
  if (!env.SITE_BUILD_HOOK_TYPE) return undefined;

  switch (env.SITE_BUILD_HOOK_TYPE) {
    case "dokploy":
      return {
        provider: "dokploy",
        config: {
          apiUrl: env.SITE_BUILD_HOOK_URL ?? "",
          apiKey: env.SITE_BUILD_HOOK_SECRET ?? "",
          applicationId: env.SITE_BUILD_HOOK_DOKPLOY_APP_ID ?? "",
          projectId: env.SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID,
        },
      };
  }
}

export default createCmsConfig({
  secret: env.PAYLOAD_SECRET,
  serverURL: env.PAYLOAD_PUBLIC_SERVER_URL,
  siteUrl: env.ASTRO_SITE_URL,
  readAccessToken: env.CMS_READ_TOKEN,
  db: mongooseAdapter({
    url: env.DATABASE_URI,
  }),
  email: resendAdapter({
    apiKey: env.RESEND_API_KEY,
    defaultFromAddress: env.EMAIL_FROM_ADDRESS,
    defaultFromName: env.EMAIL_FROM_NAME,
  }),
  storagePlugins: buildStoragePlugins(),
  deployHook:
    env.WEB_DEPLOY_WEBHOOK_URL && env.WEB_DEPLOY_BRANCH
      ? { webhookUrl: env.WEB_DEPLOY_WEBHOOK_URL, branch: env.WEB_DEPLOY_BRANCH }
      : undefined,
  devRefreshUrl: env.WEB_DEV_REFRESH_URL,
  deploymentLogView: buildDeploymentLogView(),
});
