import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

type S3BucketConfig = {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const isNoSuchBucketError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & { name?: string; Code?: string };
  return candidate.name === "NotFound" || candidate.name === "NoSuchBucket" || candidate.Code === "NoSuchBucket";
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
    if (!isNoSuchBucketError(error)) {
      throw error;
    }

    await s3Client.send(new CreateBucketCommand({ Bucket: config.bucket }));
  }
};
