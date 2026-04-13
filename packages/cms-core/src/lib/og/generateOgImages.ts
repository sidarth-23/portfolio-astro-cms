import type { Payload } from "payload";

import { fetchIconSvg, svgToDataUri } from "./fetchIconSvg";
import { fetchProfileImageDataUri, fetchSidebarIcons } from "./fetchProfileImage";
import { renderOgImage } from "./renderOgImage";

export type OgGenerationMode = "unset-only" | "replace-all";

export type OgGenerationResult = {
  total: number;
  generated: number;
  skipped: number;
  errors: Array<{ entity: string; error: string }>;
};

type SeoEntity =
  | { kind: "collection"; collection: "posts" | "series"; id: number; title: string; slug: string; hasMetaImage: boolean; status?: "draft" | "published" | null }
  | { kind: "global"; slug: string; label: string; title: string; hasMetaImage: boolean };

async function collectEntities(payload: Payload): Promise<SeoEntity[]> {
  const entities: SeoEntity[] = [];

  // Posts (has drafts)
  const posts = await payload.find({
    collection: "posts",
    limit: 0,
    pagination: false,
    depth: 0,
  });
  for (const post of posts.docs) {
    entities.push({
      kind: "collection",
      collection: "posts",
      id: post.id,
      title: post.title,
      slug: post.slug ?? String(post.id),
      hasMetaImage: Boolean(post.meta?.image),
      status: post._status,
    });
  }

  // Series
  const series = await payload.find({
    collection: "series",
    limit: 0,
    pagination: false,
    depth: 0,
  });
  for (const s of series.docs) {
    entities.push({
      kind: "collection",
      collection: "series",
      id: s.id,
      title: s.name,
      slug: s.slug ?? String(s.id),
      hasMetaImage: Boolean(s.meta?.image),
    });
  }

  // Globals
  const globalDefs: Array<{ slug: string; label: string }> = [
    { slug: "home-page", label: "Home" },
    { slug: "cv-page", label: "CV" },
    { slug: "blog-page", label: "Blog" },
    { slug: "series-page", label: "Series" },
    { slug: "projects-page", label: "Projects" },
    { slug: "not-found-page", label: "404" },
  ];

  for (const { slug, label } of globalDefs) {
    const globalDoc = await payload.findGlobal({ slug: slug as Parameters<typeof payload.findGlobal>[0]["slug"], depth: 0 });
    const doc = globalDoc as unknown as Record<string, unknown>;

    // Resolve title: use meta.title if available, then content title, then label
    const meta = doc["meta"] as { title?: string; image?: unknown } | undefined;
    const contentTitle = (doc["title"] ?? doc["name"]) as string | undefined;
    const title = meta?.title ?? contentTitle ?? label;

    entities.push({
      kind: "global",
      slug,
      label,
      title,
      hasMetaImage: Boolean(meta?.image),
    });
  }

  return entities;
}

async function uploadOgImage(
  payload: Payload,
  pngBuffer: Buffer,
  filename: string,
  altText: string,
): Promise<number> {
  const mediaDoc = await payload.create({
    collection: "media",
    data: {
      alt: altText,
    },
    file: {
      data: pngBuffer,
      mimetype: "image/png",
      name: filename,
      size: pngBuffer.length,
    },
  });
  return mediaDoc.id;
}

async function updateMetaImage(
  payload: Payload,
  entity: SeoEntity,
  mediaId: number,
): Promise<void> {
  if (entity.kind === "collection") {
    await payload.update({
      collection: entity.collection,
      id: entity.id,
      data: {
        meta: {
          image: mediaId,
        },
      },
      // Preserve draft status for posts
      ...(entity.collection === "posts" && entity.status === "draft" ? { draft: true } : {}),
    });
  } else {
    await payload.updateGlobal({
      slug: entity.slug as Parameters<typeof payload.updateGlobal>[0]["slug"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { meta: { image: mediaId } } as any,
    });
  }
}

export async function generateOgImages(
  payload: Payload,
  mode: OgGenerationMode,
): Promise<OgGenerationResult> {
  // Load shared assets
  const [profileImageDataUri, iconValues] = await Promise.all([
    fetchProfileImageDataUri(payload),
    fetchSidebarIcons(payload),
  ]);

  // Fetch icon SVGs and convert to data URIs
  const iconSvgs = await Promise.all(iconValues.map((v) => fetchIconSvg(v)));
  const socialIconDataUris = (
    await Promise.all(
      iconSvgs
        .filter((svg): svg is string => svg !== null)
        .map((svg) => svgToDataUri(svg)),
    )
  );

  // Collect all entities
  const entities = await collectEntities(payload);

  const result: OgGenerationResult = {
    total: entities.length,
    generated: 0,
    skipped: 0,
    errors: [],
  };

  for (const entity of entities) {
    const entityLabel = entity.kind === "collection"
      ? `${entity.collection}/${entity.id} (${entity.title})`
      : `global/${entity.slug} (${entity.title})`;

    if (mode === "unset-only" && entity.hasMetaImage) {
      result.skipped++;
      continue;
    }

    try {
      const pngBuffer = await renderOgImage({
        title: entity.title,
        profileImageDataUri,
        socialIconDataUris,
      });

      const filename =
        entity.kind === "collection"
          ? `og-${entity.collection}-${entity.slug}.png`
          : `og-${entity.slug}.png`;

      const mediaId = await uploadOgImage(
        payload,
        pngBuffer,
        filename,
        `OG image for ${entity.title}`,
      );

      await updateMetaImage(payload, entity, mediaId);

      result.generated++;
    } catch (error) {
      result.errors.push({
        entity: entityLabel,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
