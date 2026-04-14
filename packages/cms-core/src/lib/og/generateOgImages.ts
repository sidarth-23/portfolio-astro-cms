import type { Payload } from "payload";

import type { Media } from "../../payload-types";
import type { IconFetchFailureReason } from "./fetchIconSvg";
import { fetchIconSvg, svgToDataUri } from "./fetchIconSvg";
import type { SidebarIconDiagnostic } from "./fetchProfileImage";
import { fetchProfileImageDataUri, fetchSidebarIcons, getSidebarIconDiagnostics } from "./fetchProfileImage";
import type { OgTarget } from "./registry";
import { OG_TARGETS } from "./registry";
import { renderOgImage } from "./renderOgImage";

export type OgGenerationMode = "unset-only" | "replace-all";

export type OgGenerationResult = {
  total: number;
  generated: number;
  skipped: number;
  errors: Array<{ entity: string; error: string }>;
  iconDiagnostics: {
    configured: number;
    loaded: number;
    failed: number;
    invalidConfigured: SidebarIconDiagnostic[];
    failedToLoad: Array<{
      index: number;
      iconValue: string;
      reason: IconFetchFailureReason;
      message: string;
    }>;
  };
};

export type GenerateOgImagesOptions = {
  siteUrl?: string;
};

type SharedAssets = {
  profileImageDataUri: string | undefined;
  socialIconDataUris: string[];
  siteUrl?: string;
};

type ProcessorResult = {
  generated: number;
  skipped: number;
  errors: Array<{ entity: string; error: string }>;
};

type SeoMeta = {
  title: string;
  description: string;
  image?: (string | number | null) | Media;
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
    (typeof (value as Media).id === "number" || typeof (value as Media).id === "string")
  ) {
    return (value as Media).id;
  }
  return null;
}

/**
 * Get complete SEO meta from a document.
 * Returns null if title or description are missing — the update must include
 * both required fields or Payload's field validation will reject it.
 */
function getSeoMeta(doc: ContentRecord): SeoMeta | null {
  const meta = doc.meta as SeoMeta | undefined;
  if (!meta?.title?.trim() || !meta?.description?.trim()) return null;
  return meta;
}

/**
 * Get the title to render on the OG image.
 * Uses the configured field if specified, otherwise falls back to meta.title.
 */
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

/** Auto-generate an entity label for error reporting */
function getEntityLabel(target: OgTarget, doc: ContentRecord): string {
  if (target.type === "collection") {
    const name = doc.title ?? doc.name ?? doc.slug ?? "";
    return `${target.slug}/${doc.id} (${name})`;
  }
  return `global/${target.slug}`;
}

/** Auto-generate the OG image filename */
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
    data: { alt: `OG image for ${title}` },
    file: { data: buffer, mimetype: "image/png", name: filename, size: buffer.length },
  });

  return media.id;
}

async function processDoc(
  payload: Payload,
  target: OgTarget,
  doc: ContentRecord,
  mode: OgGenerationMode,
  assets: SharedAssets,
): Promise<{ generated: boolean; skipped: boolean; error?: string }> {
  // Check if OG image is already set (skip in unset-only mode)
  const meta = doc.meta as SeoMeta | undefined;
  const currentImageId = resolveMediaId(meta?.image);
  if (mode === "unset-only" && currentImageId !== null) {
    return { generated: false, skipped: true };
  }

  // Validate complete SEO meta — both title and description must exist
  // because Payload replaces the entire meta group on update, and they are required fields
  const seoMeta = getSeoMeta(doc);
  if (!seoMeta) {
    return {
      generated: false,
      skipped: false,
      error: "SEO title and description must be set before generating an OG image (fill in the SEO tab).",
    };
  }

  // Get title to render on the OG image
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

  // Resolve image — use existing if available, otherwise generate
  const filename = getOgFilename(target, doc);
  let imageId: RelationID;
  if (target.type === "collection" && target.existingImage) {
    const existing = resolveMediaId(doc[target.existingImage]);
    imageId = existing ?? await uploadOgImage(payload, ogTitle, ogDescription, filename, assets);
  } else {
    imageId = await uploadOgImage(payload, ogTitle, ogDescription, filename, assets);
  }

  // Build update data — always include required SEO fields to satisfy Payload field validation
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

  return { generated: true, skipped: false };
}

async function processTarget(
  payload: Payload,
  target: OgTarget,
  mode: OgGenerationMode,
  assets: SharedAssets,
): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };

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
        const docResult = await processDoc(payload, target, doc, mode, assets);
        if (docResult.generated) {
          result.generated++;
          continue;
        }

        result.skipped++;
        if (docResult.error) {
          result.errors.push({ entity: label, error: docResult.error });
        }
      } catch (error) {
        result.errors.push({ entity: label, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return result;
  }

  // Global
  try {
    const doc = (await payload.findGlobal({ slug: target.slug as never, depth: 0 })) as unknown as ContentRecord;
    const label = getEntityLabel(target, doc);

    const docResult = await processDoc(payload, target, doc, mode, assets);
    if (docResult.generated) {
      result.generated++;
    } else {
      result.skipped++;
      if (docResult.error) {
        result.errors.push({ entity: label, error: docResult.error });
      }
    }
  } catch (error) {
    result.errors.push({ entity: `global/${target.slug}`, error: error instanceof Error ? error.message : String(error) });
  }

  return result;
}

export async function generateOgImages(
  payload: Payload,
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

  const successfulIconSvgs = iconFetchResults.flatMap((item) => (item.result.ok ? [item.result.svg] : []));
  const socialIconDataUris = await Promise.all(successfulIconSvgs.map((svg) => svgToDataUri(svg)));

  const assets: SharedAssets = { profileImageDataUri, socialIconDataUris, siteUrl: options.siteUrl };

  const failedToLoad = iconFetchResults.flatMap((item) => {
    if (item.result.ok) return [];

    return [{
      index: item.entry.index,
      iconValue: item.entry.iconValue,
      reason: item.result.reason,
      message: item.result.message,
    }];
  });

  const totals: OgGenerationResult = {
    total: 0,
    generated: 0,
    skipped: 0,
    errors: [],
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

  for (const target of OG_TARGETS) {
    const targetResult = await processTarget(payload, target, mode, assets);
    totals.generated += targetResult.generated;
    totals.skipped += targetResult.skipped;
    totals.errors.push(...targetResult.errors);
    totals.total += targetResult.generated + targetResult.skipped + targetResult.errors.length;
  }

  return totals;
}
