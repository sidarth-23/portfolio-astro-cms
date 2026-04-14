import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

type S3BucketConfig = {
  bucket: string;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const getS3ErrorName = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const candidate = error as Error & { name?: string; Code?: string; code?: string };
  return candidate.Code ?? candidate.code ?? candidate.name;
};

export const ensureS3BucketExists = async (config: S3BucketConfig): Promise<void> => {
  const s3Client = new S3Client({
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    region: config.region,
  });

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.bucket }));
  } catch (error) {
    const errorName = getS3ErrorName(error);

    if (errorName === "NoSuchBucket" || errorName === "NotFound") {
      throw new Error(
        `S3 bucket \"${config.bucket}\" does not exist. Provision it before starting CMS (for local setup use: task up or task up:build).`,
      );
    }

    if (errorName === "AccessDenied") {
      throw new Error(
        `Access denied while validating S3 bucket \"${config.bucket}\". Check S3 credentials and bucket permissions.`,
      );
    }

    throw error;
  }
};
