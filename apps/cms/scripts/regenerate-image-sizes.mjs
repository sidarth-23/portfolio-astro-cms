/**
 * Regenerates all image sizes for existing media documents.
 *
 * Run inside the CMS container after deploying the updated Media collection
 * (with the new heroLg/heroMd/heroSm sizes):
 *
 *   node scripts/regenerate-image-sizes.mjs
 *
 * Requires all normal CMS env vars to be present (DATABASE_URI, PAYLOAD_SECRET,
 * S3_* credentials, etc.).
 */

import { getPayload } from "payload";
import config from "@payload-config";

const BATCH_SIZE = 10;

const payload = await getPayload({ config });

let page = 1;
let totalProcessed = 0;
let totalErrors = 0;

payload.logger.info("Starting image size regeneration...");

while (true) {
  const { docs, totalDocs, hasNextPage } = await payload.find({
    collection: "media",
    page,
    limit: BATCH_SIZE,
    depth: 0,
    select: { id: true, filename: true },
  });

  if (page === 1) {
    payload.logger.info(`Found ${totalDocs} media documents to process.`);
  }

  for (const doc of docs) {
    try {
      await payload.update({
        collection: "media",
        id: doc.id,
        data: {},
      });
      totalProcessed++;
      payload.logger.info(
        `[${totalProcessed}/${totalDocs}] Regenerated: ${doc.filename ?? doc.id}`,
      );
    } catch (err) {
      totalErrors++;
      payload.logger.error({ msg: `Failed to regenerate ${doc.filename ?? doc.id}`, err });
    }
  }

  if (!hasNextPage) break;
  page++;
}

payload.logger.info(`Done. Processed: ${totalProcessed}, Errors: ${totalErrors}.`);

process.exit(totalErrors > 0 ? 1 : 0);
