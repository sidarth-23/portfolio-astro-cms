import type { Payload } from "payload";

import type { BlogPage, CvPage, HomePage, Media, NotFoundPage, Post, Project, ProjectsPage, Series, SeriesPage } from "../../payload-types";
import type { IconFetchFailureReason } from "./fetchIconSvg";
import { fetchIconSvg, svgToDataUri } from "./fetchIconSvg";
import type { SidebarIconDiagnostic } from "./fetchProfileImage";
import { fetchProfileImageDataUri, fetchSidebarIcons, getSidebarIconDiagnostics } from "./fetchProfileImage";
import { renderOgImage } from "./renderOgImage";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts a numeric media ID from Payload's polymorphic media ref type.
 * Payload stores relationships as either a populated object or a raw ID.
 */
function resolveMediaId(ref: ((number | null) | Media) | undefined): number | null {
  if (ref === null || ref === undefined) return null;
  if (typeof ref === "number") return ref;
  return ref.id;
}

async function uploadGeneratedOgImage(
  payload: Payload,
  title: string,
  filename: string,
  assets: SharedAssets,
): Promise<number> {
  const buffer = await renderOgImage({
    title,
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

// ---------------------------------------------------------------------------
// Processors — one per entity type, each fully typed
// ---------------------------------------------------------------------------

/**
 * Posts: copy coverImage → meta.image (no Satori generation).
 * Falls back to Satori auto-generate if a post has no cover image.
 */
async function processPostsOg(
  payload: Payload,
  mode: OgGenerationMode,
  assets: SharedAssets,
): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };

  const { docs: posts } = await payload.find({
    collection: "posts",
    limit: 0,
    pagination: false,
    depth: 1, // depth 1 to resolve coverImage as Media object
  });

  for (const post of posts) {
    const label = `posts/${post.id} (${post.title})`;

    if (mode === "unset-only" && resolveMediaId(post.meta.image) !== null) {
      result.skipped++;
      continue;
    }

    try {
      const coverMediaId = resolveMediaId(post.coverImage);
      const imageId = coverMediaId
        ?? await uploadGeneratedOgImage(payload, post.title, `og-post-${post.slug}.png`, assets);
      await payload.update({
        collection: "posts",
        id: post.id,
        data: { meta: { image: imageId } },
        context: { skipDataValidation: true },
        ...(post._status === "draft" ? { draft: true } : {}),
      });
      result.generated++;
    } catch (error) {
      result.errors.push({ entity: label, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return result;
}

/**
 * Projects: copy image → meta.image (no Satori generation).
 * Falls back to Satori auto-generate if a project has no image.
 * Always sets meta title/description since projects were recently added to the SEO plugin.
 */
async function processProjectsOg(
  payload: Payload,
  mode: OgGenerationMode,
  assets: SharedAssets,
): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };

  const { docs: projects } = await payload.find({
    collection: "projects",
    limit: 0,
    pagination: false,
    depth: 1, // depth 1 to resolve image as Media object
  });

  for (const project of projects) {
    const label = `projects/${project.id} (${project.title})`;

    if (mode === "unset-only" && resolveMediaId(project.meta.image) !== null) {
      result.skipped++;
      continue;
    }

    try {
      const imageMediaId = resolveMediaId(project.image);
      const imageId = imageMediaId
        ?? await uploadGeneratedOgImage(payload, project.title, `og-project-${project.slug}.png`, assets);
      await payload.update({
        collection: "projects",
        id: project.id,
        data: { meta: { title: project.title, description: "", image: imageId } },
        context: { skipDataValidation: true },
        ...(project._status === "draft" ? { draft: true } : {}),
      });
      result.generated++;
    } catch (error) {
      result.errors.push({ entity: label, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return result;
}

/**
 * Series: auto-generate OG image via Satori.
 */
async function processSeriesOg(
  payload: Payload,
  mode: OgGenerationMode,
  assets: SharedAssets,
): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };

  const { docs: allSeries } = await payload.find({
    collection: "series",
    limit: 0,
    pagination: false,
    depth: 0,
  });

  for (const series of allSeries) {
    const label = `series/${series.id} (${series.name})`;

    if (mode === "unset-only" && resolveMediaId(series.meta.image) !== null) {
      result.skipped++;
      continue;
    }

    try {
      const mediaId = await uploadGeneratedOgImage(payload, series.name, `og-series-${series.slug}.png`, assets);
      await payload.update({
        collection: "series",
        id: series.id,
        data: { meta: { image: mediaId } },
        context: { skipDataValidation: true },
      });
      result.generated++;
    } catch (error) {
      result.errors.push({ entity: label, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return result;
}

async function processHomePageOg(payload: Payload, mode: OgGenerationMode, assets: SharedAssets): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };
  try {
    const doc: HomePage = await payload.findGlobal({ slug: "home-page", depth: 0 });
    if (mode === "unset-only" && resolveMediaId(doc.meta.image) !== null) return { ...result, skipped: 1 };
    const mediaId = await uploadGeneratedOgImage(payload, doc.meta.title, "og-home-page.png", assets);
    await payload.updateGlobal({ slug: "home-page", data: { meta: { image: mediaId } }, context: { skipDataValidation: true } });
    return { ...result, generated: 1 };
  } catch (error) {
    return { ...result, errors: [{ entity: "global/home-page", error: error instanceof Error ? error.message : String(error) }] };
  }
}

async function processCvPageOg(payload: Payload, mode: OgGenerationMode, assets: SharedAssets): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };
  try {
    const doc: CvPage = await payload.findGlobal({ slug: "cv-page", depth: 0 });
    if (mode === "unset-only" && resolveMediaId(doc.meta.image) !== null) return { ...result, skipped: 1 };
    const mediaId = await uploadGeneratedOgImage(payload, doc.meta.title, "og-cv-page.png", assets);
    await payload.updateGlobal({ slug: "cv-page", data: { meta: { image: mediaId } }, context: { skipDataValidation: true } });
    return { ...result, generated: 1 };
  } catch (error) {
    return { ...result, errors: [{ entity: "global/cv-page", error: error instanceof Error ? error.message : String(error) }] };
  }
}

async function processBlogPageOg(payload: Payload, mode: OgGenerationMode, assets: SharedAssets): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };
  try {
    const doc: BlogPage = await payload.findGlobal({ slug: "blog-page", depth: 0 });
    if (mode === "unset-only" && resolveMediaId(doc.meta.image) !== null) return { ...result, skipped: 1 };
    const mediaId = await uploadGeneratedOgImage(payload, doc.meta.title, "og-blog-page.png", assets);
    await payload.updateGlobal({ slug: "blog-page", data: { meta: { image: mediaId } }, context: { skipDataValidation: true } });
    return { ...result, generated: 1 };
  } catch (error) {
    return { ...result, errors: [{ entity: "global/blog-page", error: error instanceof Error ? error.message : String(error) }] };
  }
}

async function processSeriesPageOg(payload: Payload, mode: OgGenerationMode, assets: SharedAssets): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };
  try {
    const doc: SeriesPage = await payload.findGlobal({ slug: "series-page", depth: 0 });
    if (mode === "unset-only" && resolveMediaId(doc.meta.image) !== null) return { ...result, skipped: 1 };
    const mediaId = await uploadGeneratedOgImage(payload, doc.meta.title, "og-series-page.png", assets);
    await payload.updateGlobal({ slug: "series-page", data: { meta: { image: mediaId } }, context: { skipDataValidation: true } });
    return { ...result, generated: 1 };
  } catch (error) {
    return { ...result, errors: [{ entity: "global/series-page", error: error instanceof Error ? error.message : String(error) }] };
  }
}

async function processProjectsPageOg(payload: Payload, mode: OgGenerationMode, assets: SharedAssets): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };
  try {
    const doc: ProjectsPage = await payload.findGlobal({ slug: "projects-page", depth: 0 });
    if (mode === "unset-only" && resolveMediaId(doc.meta.image) !== null) return { ...result, skipped: 1 };
    const mediaId = await uploadGeneratedOgImage(payload, doc.meta.title, "og-projects-page.png", assets);
    await payload.updateGlobal({ slug: "projects-page", data: { meta: { image: mediaId } }, context: { skipDataValidation: true } });
    return { ...result, generated: 1 };
  } catch (error) {
    return { ...result, errors: [{ entity: "global/projects-page", error: error instanceof Error ? error.message : String(error) }] };
  }
}

async function processNotFoundPageOg(payload: Payload, mode: OgGenerationMode, assets: SharedAssets): Promise<ProcessorResult> {
  const result: ProcessorResult = { generated: 0, skipped: 0, errors: [] };
  try {
    const doc: NotFoundPage = await payload.findGlobal({ slug: "not-found-page", depth: 0 });
    if (mode === "unset-only" && resolveMediaId(doc.meta.image) !== null) return { ...result, skipped: 1 };
    const mediaId = await uploadGeneratedOgImage(payload, doc.meta.title, "og-not-found-page.png", assets);
    await payload.updateGlobal({ slug: "not-found-page", data: { meta: { image: mediaId } }, context: { skipDataValidation: true } });
    return { ...result, generated: 1 };
  } catch (error) {
    return { ...result, errors: [{ entity: "global/not-found-page", error: error instanceof Error ? error.message : String(error) }] };
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Generates and uploads OG images for all SEO-enabled entities.
 *
 * Image strategy per entity:
 * - posts     → copy coverImage field; fallback to Satori auto-generate
 * - projects  → copy image field; fallback to Satori auto-generate
 * - series    → Satori auto-generate
 * - all globals → Satori auto-generate
 *
 * Add new entities by implementing a processor function above and adding it
 * to the PROCESSORS array below.
 */
export async function generateOgImages(
  payload: Payload,
  mode: OgGenerationMode,
  options: GenerateOgImagesOptions = {},
): Promise<OgGenerationResult> {
  // Load shared assets once — profile image and social icons from site-settings
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
  const socialIconDataUris = await Promise.all(successfulIconSvgs.map((s) => svgToDataUri(s)));

  const assets: SharedAssets = { profileImageDataUri, socialIconDataUris, siteUrl: options.siteUrl };

  const processors = [
    processPostsOg,
    processProjectsOg,
    processSeriesOg,
    processHomePageOg,
    processCvPageOg,
    processBlogPageOg,
    processSeriesPageOg,
    processProjectsPageOg,
    processNotFoundPageOg,
  ];

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

  for (const processor of processors) {
    const r = await processor(payload, mode, assets);
    totals.generated += r.generated;
    totals.skipped += r.skipped;
    totals.errors.push(...r.errors);
    totals.total += r.generated + r.skipped + r.errors.length;
  }

  return totals;
}
