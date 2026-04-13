import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    PAYLOAD_SECRET: z.string().min(1),
    PAYLOAD_PUBLIC_SERVER_URL: z.string().url(),
    ASTRO_SITE_URL: z.string().url().default("http://localhost:4321"),
    DATABASE_URI: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM_ADDRESS: z.string().email(),
    EMAIL_FROM_NAME: z.string().min(1),
    CMS_READ_TOKEN: z.string().min(1),
    S3_BUCKET: z.string().default("sidshub-media"),
    S3_REGION: z.string().default("us-east-1"),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().default(""),
    S3_SECRET_ACCESS_KEY: z.string().default(""),
    S3_AUTO_CREATE_BUCKET: z.enum(["true", "false"]).optional(),
    PAYLOAD_DB_PUSH: z.enum(["true", "false"]).optional(),
    WEB_DEPLOY_WEBHOOK_URL: z.string().url().optional(),
    WEB_DEPLOY_BRANCH: z.string().optional(),
    WEB_DEV_REFRESH_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
