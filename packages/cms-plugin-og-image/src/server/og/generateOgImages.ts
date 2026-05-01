import type { Payload } from "payload";

import type {
  GenerateOgImagesOptions,
  OgGenerationMode,
  OgGenerationResult,
  OgTarget,
} from "../../types";
import { fetchIconSvg, svgToDataUri } from "./fetchIconSvg";
import { ensureOgFolder } from "./ensureOgFolder";
import {
  fetchProfileImageDataUri,
  fetchSidebarIcons,
  getSidebarIconDiagnostics,
} from "./fetchProfileImage";
import { renderOgImage } from "./renderOgImage";

export type { OgGenerationMode, OgGenerationResult, GenerateOgImagesOptions };

// ---- Internal types ----

type SharedAssets = {
  profileImageDataUri: string | undefined;
  socialIconDataUris: string[];
  siteUrl?: string;
};

type ProcessorResult = {
  generated: number;
  skipped: number;
  errors: Array<{ entity: string; error: string }>;
  replaced: Array<{ entity: string; oldImageId: string; newImageId: string }>;
};

type ProcessDocResult = {
  generated: boolean;
  skipped: boolean;
  error?: string;
  replacedImage?: { oldImageId: string; newImageId: string };
};

type SeoMeta = {
  title: string;
  description: string;
  image?: unknown;
};

type ContentRecord = Record<string, unknown>;
type RelationID = number | string;

// ---- Helpers ----

function resolveMediaId(value: unknown): RelationID | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (
    typeof value === "object" &&
    "id" in value &&
    (typeof (value as Record<string, unknown>).id === "number" ||
      typeof (value as Record<string, unknown>).id === "string")
  ) {
    return (value as Record<string, unknown>).id as RelationID;
  }
  return null;
}

function getSeoMeta(doc: ContentRecord): SeoMeta | null {
  const meta = doc.meta as SeoMeta | undefined;
  if (!meta?.title?.trim() || !meta?.description?.trim()) return null;
  return meta;
}

function getOgTitle(target: OgTarget, doc: ContentRecord): string | null {
  if (target.ogTitle) {
    const val = doc[target.ogTitle];
    return typeof val === "string" && val.trim() ? val.trim() : null;
  }
  const meta = doc.meta as SeoMeta | undefined;
  return meta?.title?.trim() || null;
}

function getOgDescription(target: OgTarget, doc: ContentRecord): string | null {
  if (target.ogDescription) {
    const val = doc[target.ogDescription];
    return typeof val === "string" && val.trim() ? val.trim() : null;
  }
  const meta = doc.meta as SeoMeta | undefined;
  return meta?.description?.trim() || null;
}

function getEntityLabel(target: OgTarget, doc: ContentRecord): string {
  if (target.type === "collection") {
    const name = doc.title ?? doc.name ?? doc.slug ?? "";
    return `${target.slug}/${doc.id} (${name})`;
  }
  return `global/${target.slug}`;
}

function getOgFilename(target: OgTarget, doc: ContentRecord): string {
  if (target.type === "collection") {
    const slug = typeof doc.slug === "string" ? doc.slug : String(doc.id ?? "item");
    return `og-${target.slug}-${slug}.png`;
  }
  return `og-${target.slug}.png`;
}

async function uploadOgImage(
  payload: Payload,
  title: string,
  description: string,
  filename: string,
  ogFolderId: number | string,
  assets: SharedAssets,
): Promise<RelationID> {
  const buffer = await renderOgImage({
    title,
    description,
    profileImageDataUri: assets.profileImageDataUri,
    socialIconDataUris: assets.socialIconDataUris,
    siteUrl: assets.siteUrl,
  });

  const media = await payload.create({
    collection: "media",
    data: { alt: `OG image for ${title}`, folder: ogFolderId } as never,
    file: { data: buffer, mimetype: "image/png", name: filename, size: buffer.length },
  });

  return media.id;
}

async function processDoc(
  payload: Payload,
  target: OgTarget,
  doc: ContentRecord,
  mode: OgGenerationMode,
  ogFolderId: number | string,
  assets: SharedAssets,
): Promise<ProcessDocResult> {
  const meta = doc.meta as SeoMeta | undefined;
  const currentImageId = resolveMediaId(meta?.image);
  if (mode === "unset-only" && currentImageId !== null) {
    return { generated: false, skipped: true };
  }

  const seoMeta = getSeoMeta(doc);
  if (!seoMeta) {
    return {
      generated: false,
      skipped: false,
      error:
        "SEO title and description must be set before generating an OG image (fill in the SEO tab).",
    };
  }

  const ogTitle = getOgTitle(target, doc);
  if (!ogTitle) {
    return {
      generated: false,
      skipped: false,
      error: `Cannot generate OG image: the configured title field "${target.ogTitle}" is empty.`,
    };
  }

  const ogDescription = getOgDescription(target, doc);
  if (!ogDescription) {
    const descriptionSource = target.ogDescription ?? "meta.description";
    return {
      generated: false,
      skipped: false,
      error: `Cannot generate OG image: the configured description field "${descriptionSource}" is empty.`,
    };
  }

  const filename = getOgFilename(target, doc);
  const imageId = await uploadOgImage(
    payload,
    ogTitle,
    ogDescription,
    filename,
    ogFolderId,
    assets,
  );
  const nextImageId = String(imageId);

  const updateData = {
    meta: { title: seoMeta.title, description: seoMeta.description, image: imageId },
  };

  if (target.type === "collection") {
    const docId = doc.id;
    if (typeof docId !== "number" && typeof docId !== "string") {
      return { generated: false, skipped: false, error: "Cannot update: document ID is missing." };
    }

    await payload.update({
      collection: target.slug as never,
      id: docId,
      data: updateData as never,
      context: { skipDataValidation: true },
    });
  } else {
    await payload.updateGlobal({
      slug: target.slug as never,
      data: updateData as never,
      context: { skipDataValidation: true },
    });
  }

  const previousImageId = currentImageId !== null ? String(currentImageId) : null;

  return {
    generated: true,
    skipped: false,
    replacedImage:
      previousImageId !== null && previousImageId !== nextImageId
        ? { oldImageId: previousImageId, newImageId: nextImageId }
        : undefined,
  };
}

// ---- Cleanup: collect meta.image IDs from all OG targets ----

async function collectOgMetaImageIds(payload: Payload, targets: OgTarget[]): Promise<Set<string>> {
  const ids = new Set<string>();

  await Promise.all(
    targets.map(async (target) => {
      try {
        if (target.type === "collection") {
          let page = 1;
          while (true) {
            const result = await payload.find({
              collection: target.slug as never,
              depth: 0,
              limit: 100,
              page,
              select: { meta: true } as never,
            });
            for (const doc of result.docs) {
              const meta = (doc as Record<string, unknown>).meta;
              if (meta && typeof meta === "object") {
                const id = (meta as Record<string, unknown>).image;
                if (id !== null && id !== undefined) {
                  const resolved =
                    typeof id === "string"
                      ? id
                      : typeof id === "number"
                        ? String(id)
                        : typeof id === "object" && "id" in (id as object)
                          ? String((id as Record<string, unknown>).id)
                          : null;
                  if (resolved) ids.add(resolved);
                }
              }
            }
            if (page >= result.totalPages) break;
            page++;
          }
        } else {
          const doc = await payload.findGlobal({ slug: target.slug as never, depth: 0 });
          const meta = (doc as unknown as Record<string, unknown>).meta;
          if (meta && typeof meta === "object") {
            const id = (meta as Record<string, unknown>).image;
            if (id !== null && id !== undefined) {
              const resolved =
                typeof id === "string" ? id : typeof id === "number" ? String(id) : null;
              if (resolved) ids.add(resolved);
            }
          }
        }
      } catch {
        // Target might not exist yet — skip
      }
    }),
  );

  return ids;
}

type CleanupResult = {
  attempted: number;
  deleted: number;
  skippedReferenced: number;
  failed: number;
  errors: Array<{ entity: string; imageId: string; error: string }>;
};

async function cleanupReplacedOldImages(
  payload: Payload,
  targets: OgTarget[],
  replaced: Array<{ entity: string; oldImageId: string; newImageId: string }>,
): Promise<CleanupResult> {
  const byOldId = new Map<string, string[]>();

  for (const item of replaced) {
    const entities = byOldId.get(item.oldImageId) ?? [];
    entities.push(item.entity);
    byOldId.set(item.oldImageId, entities);
  }

  const result: CleanupResult = {
    attempted: byOldId.size,
    deleted: 0,
    skippedReferenced: 0,
    failed: 0,
    errors: [],
  };

  if (byOldId.size === 0) return result;

  // Only check meta.image references across OG targets (OG images only live in meta.image)
  const referencedIds = await collectOgMetaImageIds(payload, targets);

  for (const [oldImageId, entities] of byOldId.entries()) {
    if (referencedIds.has(oldImageId)) {
      result.skippedReferenced++;
      continue;
    }

    try {
      await payload.delete({ collection: "media", id: oldImageId });
      result.deleted++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        entity: entities.join(", "),
        imageId: oldImageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

async function processTarget(
  payload: Payload,
  target: OgTarget,
  mode: OgGenerationMode,
  assets: SharedAssets,
): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [], replaced: [] };
  const ogFolderId = await ensureOgFolder(payload, target.folderName);

  if (target.type === "collection") {
    const found = await payload.find({
      collection: target.slug as never,
      limit: 0,
      pagination: false,
      depth: target.depth ?? 0,
    });

    for (const rawDoc of found.docs) {
      const doc = rawDoc as unknown as ContentRecord;
      const label = getEntityLabel(target, doc);

      try {
        const docResult = await processDoc(payload, target, doc, mode, ogFolderId, assets);
        if (docResult.generated) {
          result.generated++;
          if (docResult.replacedImage) {
            result.replaced.push({ entity: label, ...docResult.replacedImage });
          }
          continue;
        }

        result.skipped++;
        if (docResult.error) {
          result.errors.push({ entity: label, error: docResult.error });
        }
      } catch (error) {
        result.errors.push({
          entity: label,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  // Global
  try {
    const doc = (await payload.findGlobal({
      slug: target.slug as never,
      depth: 0,
    })) as unknown as ContentRecord;
    const label = getEntityLabel(target, doc);

    const docResult = await processDoc(payload, target, doc, mode, ogFolderId, assets);
    if (docResult.generated) {
      result.generated++;
      if (docResult.replacedImage) {
        result.replaced.push({ entity: label, ...docResult.replacedImage });
      }
    } else {
      result.skipped++;
      if (docResult.error) {
        result.errors.push({ entity: label, error: docResult.error });
      }
    }
  } catch (error) {
    result.errors.push({
      entity: `global/${target.slug}`,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return result;
}

/**
 * Generate OG images for all provided targets.
 *
 * @param payload - Payload instance
 * @param targets - OG targets (collections/globals) to process
 * @param mode - "unset-only" skips docs that already have a meta.image; "replace-all" regenerates
 * @param options - optional siteUrl and wipeOldImages flag
 */
export async function generateOgImages(
  payload: Payload,
  targets: OgTarget[],
  mode: OgGenerationMode,
  options: GenerateOgImagesOptions = {},
): Promise<OgGenerationResult> {
  const [profileImageDataUri, iconEntries] = await Promise.all([
    fetchProfileImageDataUri(payload),
    fetchSidebarIcons(payload),
  ]);

  const invalidConfigured = getSidebarIconDiagnostics(iconEntries);
  const iconFetchResults = await Promise.all(
    iconEntries.map(async (entry) => ({
      entry,
      result: await fetchIconSvg(entry.iconValue),
    })),
  );

  const successfulIconSvgs = iconFetchResults.flatMap((item) =>
    item.result.ok ? [item.result.svg] : [],
  );
  const socialIconDataUris = await Promise.all(successfulIconSvgs.map((svg) => svgToDataUri(svg)));

  const assets: SharedAssets = {
    profileImageDataUri,
    socialIconDataUris,
    siteUrl: options.siteUrl,
  };

  const failedToLoad = iconFetchResults.flatMap((item) => {
    if (item.result.ok) return [];
    return [
      {
        index: item.entry.index,
        iconValue: item.entry.iconValue,
        reason: item.result.reason,
        message: item.result.message,
      },
    ];
  });

  const totals: OgGenerationResult = {
    total: 0,
    generated: 0,
    skipped: 0,
    errors: [],
    cleanup: {
      enabled: options.wipeOldImages === true,
      attempted: 0,
      deleted: 0,
      skippedReferenced: 0,
      failed: 0,
      errors: [],
    },
    iconDiagnostics: {
      configured: iconEntries.length,
      loaded: successfulIconSvgs.length,
      failed: failedToLoad.length,
      invalidConfigured,
      failedToLoad,
    },
  };

  for (const failure of failedToLoad) {
    totals.errors.push({
      entity: `site-settings/sidebarFooterItems[${failure.index}]`,
      error: `${failure.message} (stored value: "${failure.iconValue}")`,
    });
  }

  const replacedCandidates: Array<{ entity: string; oldImageId: string; newImageId: string }> = [];

  for (const target of targets) {
    const targetResult = await processTarget(payload, target, mode, assets);
    totals.generated += targetResult.generated;
    totals.skipped += targetResult.skipped;
    totals.errors.push(...targetResult.errors);
    replacedCandidates.push(...targetResult.replaced);
    totals.total += targetResult.generated + targetResult.skipped + targetResult.errors.length;
  }

  if (options.wipeOldImages) {
    const cleanup = await cleanupReplacedOldImages(payload, targets, replacedCandidates);
    totals.cleanup = { enabled: true, ...cleanup };
    for (const cleanupError of cleanup.errors) {
      totals.errors.push({
        entity: cleanupError.entity,
        error: `Failed to delete old image ${cleanupError.imageId}: ${cleanupError.error}`,
      });
    }
  }

  return totals;
}
