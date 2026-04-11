import { getPayload } from "payload";

import config from "../payload.config";

const DEFAULT_RETENTION_DAYS = 7;
const PAGE_SIZE = 100;

type CandidateMedia = {
  id: number | string;
  createdAt: string;
  filename?: string | null;
};

const parseRetentionDays = (): number => {
  const value = Number.parseInt(process.env.MEDIA_CLEANUP_DAYS || `${DEFAULT_RETENTION_DAYS}`, 10);
  return Number.isNaN(value) || value < 1 ? DEFAULT_RETENTION_DAYS : value;
};

const isDryRun = (): boolean => {
  return process.env.MEDIA_CLEANUP_DRY_RUN === "true";
};

const isMediaRelation = (value: unknown, id: number | string): boolean => {
  if (value === id) {
    return true;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as { id?: number | string }).id === id;
};

const hasCollectionReference = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: "posts" | "projects" | "users",
  field: string,
  id: number | string,
): Promise<boolean> => {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      [field]: {
        equals: id,
      },
    },
  });

  return result.docs.length > 0;
};

const hasGlobalReference = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  id: number | string,
): Promise<boolean> => {
  const siteSettings = await payload.findGlobal({
    slug: "site-settings",
    depth: 0,
  });

  return isMediaRelation(siteSettings.profileImage, id);
};

const isReferenced = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  id: number | string,
): Promise<boolean> => {
  const checks = await Promise.all([
    hasCollectionReference(payload, "posts", "coverImage", id),
    hasCollectionReference(payload, "projects", "image", id),
    hasCollectionReference(payload, "users", "avatar", id),
    hasGlobalReference(payload, id),
  ]);

  return checks.some(Boolean);
};

const collectCandidates = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  cutoff: string,
): Promise<CandidateMedia[]> => {
  const docs: CandidateMedia[] = [];
  let page = 1;

  while (true) {
    const result = await payload.find({
      collection: "media",
      depth: 0,
      limit: PAGE_SIZE,
      page,
      sort: "createdAt",
      where: {
        createdAt: {
          less_than: cutoff,
        },
      },
    });

    docs.push(
      ...result.docs.map((doc) => ({
        createdAt: doc.createdAt,
        filename: doc.filename,
        id: doc.id,
      })),
    );

    if (!result.hasNextPage) {
      break;
    }

    page += 1;
  }

  return docs;
};

const main = async (): Promise<void> => {
  const payload = await getPayload({ config });
  const retentionDays = parseRetentionDays();
  const dryRun = isDryRun();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const candidates = await collectCandidates(payload, cutoff);

  let deleted = 0;
  let referenced = 0;
  let failed = 0;

  payload.logger.info(
    `Media cleanup starting. candidates=${candidates.length} retentionDays=${retentionDays} dryRun=${dryRun}`,
  );

  for (const candidate of candidates) {
    try {
      if (await isReferenced(payload, candidate.id)) {
        referenced += 1;
        continue;
      }

      if (dryRun) {
        payload.logger.info(`Dry run: would delete media ${candidate.id} (${candidate.filename || "unknown"}).`);
        continue;
      }

      await payload.delete({
        collection: "media",
        id: candidate.id,
      });
      deleted += 1;
    } catch (error) {
      failed += 1;
      payload.logger.error({
        err: error,
        msg: `Failed to clean up media ${candidate.id}.`,
      });
    }
  }

  payload.logger.info(
    `Media cleanup completed. scanned=${candidates.length} referenced=${referenced} deleted=${deleted} failed=${failed} dryRun=${dryRun}`,
  );
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
