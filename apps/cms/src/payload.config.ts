import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { resendAdapter } from "@payloadcms/email-resend";
import { s3Storage } from "@payloadcms/storage-s3";
import { createCmsConfig } from "@sidshub/cms-core/builder";
import { createDeploymentAdapter } from "@sidshub/cms-core/deployment";
import type { HookConfig } from "@sidshub/cms-core/deployment";

import { env } from "./env";
import { ensureS3BucketExists } from "./lib/ensureS3Bucket";

function buildDeploymentAdapter(): ReturnType<typeof createDeploymentAdapter> | undefined {
  if (!env.SITE_BUILD_HOOK_TYPE) return undefined;
  switch (env.SITE_BUILD_HOOK_TYPE) {
    case "dokploy":
      if (
        !env.SITE_BUILD_HOOK_URL ||
        !env.SITE_BUILD_HOOK_SECRET ||
        !env.SITE_BUILD_HOOK_DOKPLOY_APP_ID
      ) {
        return undefined;
      }
      return createDeploymentAdapter({
        type: "dokploy",
        apiUrl: env.SITE_BUILD_HOOK_URL,
        apiKey: env.SITE_BUILD_HOOK_SECRET,
        applicationId: env.SITE_BUILD_HOOK_DOKPLOY_APP_ID,
        projectId: env.SITE_BUILD_HOOK_DOKPLOY_PROJECT_ID,
      } satisfies HookConfig);
  }
}

function isDeploymentHookValid(): boolean {
  if (!env.SITE_BUILD_HOOK_TYPE) return false;
  switch (env.SITE_BUILD_HOOK_TYPE) {
    case "dokploy":
      return !!(
        env.SITE_BUILD_HOOK_URL &&
        env.SITE_BUILD_HOOK_SECRET &&
        env.SITE_BUILD_HOOK_DOKPLOY_APP_ID
      );
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
  deploymentStatus: buildDeploymentAdapter(),
  showDeploymentStatus: !!env.SITE_BUILD_HOOK_TYPE,
  deploymentHookType: env.SITE_BUILD_HOOK_TYPE,
  deploymentHookValid: isDeploymentHookValid(),
  onInit: async () => {
    await ensureS3BucketExists({
      bucket: env.S3_BUCKET,
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    });
  },
});
