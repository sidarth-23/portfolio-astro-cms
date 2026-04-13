import type { Payload } from "payload";

import type { BlogPage, CvPage, HomePage, Media, NotFoundPage, Post, Project, ProjectsPage, Series, SeriesPage } from "../../payload-types";
import { fetchIconSvg, svgToDataUri } from "./fetchIconSvg";
import { fetchProfileImageDataUri, fetchSidebarIcons } from "./fetchProfileImage";
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

type SeoMeta = {
  title: string;
  description: string;
  image?: (number | null) | Media;
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

/**
 * Updates a global's meta.image field.
 *
 * NOTE: Payload's `updateGlobal` data type is derived from `RequiredDataFromGlobalSlug`
 * which, for globals with mostly-optional fields, resolves to a near-empty type that
 * does not include plugin-added fields like `meta`. The cast below is the single
 * necessary workaround for this Payload type-system gap — the runtime data shape
 * is correct since all globals in payload-types.ts have a typed `meta` field.
 */
async function updateGlobalMeta(
  payload: Payload,
  slug: keyof (typeof payload)["config"]["globals"] extends never
    ? string
    : string,
  currentMeta: SeoMeta,
  newImageId: number,
): Promise<void> {
  const data: SeoMeta = {
    title: currentMeta.title,
    description: currentMeta.description,
    image: newImageId,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await payload.updateGlobal({ slug: slug as any, data: { meta: data } as any, context: { skipDataValidation: true } });
}

async function updateCollectionPostMeta(
  payload: Payload,
  post: Post,
  newImageId: number,
): Promise<void> {
  await payload.update({
    collection: "posts",
    id: post.id,
    data: {
      meta: {
        title: post.meta.title,
        description: post.meta.description,
        image: newImageId,
      },
    },
    context: { skipDataValidation: true },
    ...(post._status === "draft" ? { draft: true } : {}),
  });
}

async function updateCollectionSeriesMeta(
  payload: Payload,
  series: Series,
  newImageId: number,
): Promise<void> {
  await payload.update({
    collection: "series",
    id: series.id,
    data: {
      meta: {
        title: series.meta.title,
        description: series.meta.description,
        image: newImageId,
      },
    },
    context: { skipDataValidation: true },
  });
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

      if (coverMediaId !== null) {
        await updateCollectionPostMeta(payload, post, coverMediaId);
      } else {
        // No cover image — fall back to auto-generate
        const mediaId = await uploadGeneratedOgImage(
          payload,
          post.title,
          `og-post-${post.slug}.png`,
          assets,
        );
        await updateCollectionPostMeta(payload, post, mediaId);
      }

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
 *
 * NOTE: Project.meta will be typed after running `generate:types` following
 * the addition of "projects" to the seoPlugin collections in builder.ts.
 * Until then, meta is accessed via the SEO plugin's runtime data.
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

    const projectMeta = project.meta;
    const hasMetaImage = resolveMediaId(projectMeta.image) !== null;

    if (mode === "unset-only" && hasMetaImage) {
      result.skipped++;
      continue;
    }

    try {
      const imageMediaId = resolveMediaId(project.image);
      const mergedMeta: SeoMeta = {
        title: projectMeta.title,
        description: projectMeta.description,
        image: imageMediaId ?? undefined,
      };

      let finalMediaId: number;

      if (imageMediaId !== null) {
        finalMediaId = imageMediaId;
      } else {
        // No project image — fall back to auto-generate
        finalMediaId = await uploadGeneratedOgImage(
          payload,
          project.title,
          `og-project-${project.slug}.png`,
          assets,
        );
      }

      await payload.update({
        collection: "projects",
        id: project.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { meta: { ...mergedMeta, image: finalMediaId } } as any,
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
      const mediaId = await uploadGeneratedOgImage(
        payload,
        series.meta.title,
        `og-series-${series.slug}.png`,
        assets,
      );
      await updateCollectionSeriesMeta(payload, series, mediaId);
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
    await updateGlobalMeta(payload, "home-page", doc.meta, mediaId);
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
    await updateGlobalMeta(payload, "cv-page", doc.meta, mediaId);
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
    await updateGlobalMeta(payload, "blog-page", doc.meta, mediaId);
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
    await updateGlobalMeta(payload, "series-page", doc.meta, mediaId);
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
    await updateGlobalMeta(payload, "projects-page", doc.meta, mediaId);
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
    await updateGlobalMeta(payload, "not-found-page", doc.meta, mediaId);
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
  const [profileImageDataUri, iconValues] = await Promise.all([
    fetchProfileImageDataUri(payload),
    fetchSidebarIcons(payload),
  ]);

  const iconSvgResults = await Promise.all(iconValues.map((v) => fetchIconSvg(v)));
  const socialIconDataUris = await Promise.all(
    iconSvgResults.filter((s): s is string => s !== null).map((s) => svgToDataUri(s)),
  );

  const assets: SharedAssets = { profileImageDataUri, socialIconDataUris, siteUrl: options.siteUrl };

  // Add new entity processors here to extend the system
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

  const totals: OgGenerationResult = { total: 0, generated: 0, skipped: 0, errors: [] };

  for (const processor of processors) {
    const r = await processor(payload, mode, assets);
    totals.generated += r.generated;
    totals.skipped += r.skipped;
    totals.errors.push(...r.errors);
    totals.total += r.generated + r.skipped + r.errors.length;
  }

  return totals;
}
