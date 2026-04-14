import type { Payload } from "payload";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type OrphanedMediaItem = {
  id: string;
  filename: string | null;
  alt: string | null;
  url: string | null;
  createdAt: string;
};

export type OrphanedMediaResult = {
  orphaned: OrphanedMediaItem[];
  totalMedia: number;
  totalReferenced: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a media field value (at depth: 0) to a string ID, or null if unset.
 * At depth 0 Payload returns the raw ID (string). If a populated object leaks
 * through we also handle that case by reading `.id`.
 */
function resolveId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in (value as object)) {
    const id = (value as Record<string, unknown>).id;
    if (typeof id === "string") return id;
  }
  return null;
}

/**
 * Recursively walk a Lexical JSON node tree and collect referenced media IDs.
 *
 * Handles:
 *   - Upload nodes:  { type: "upload", relationTo: "media", value: { id: string } }
 *   - Block nodes:   { type: "block", fields: { blockType: "imageGallery",
 *                      images: [{ image: string }] } }
 *   - Children:      { children: [...] }  — recurse
 */
function walkLexicalNode(node: unknown, ids: Set<string>): void {
  if (node === null || typeof node !== "object") return;

  const n = node as Record<string, unknown>;

  if (n.type === "upload" && n.relationTo === "media") {
    const id = resolveId(
      (n.value as Record<string, unknown> | undefined)?.id,
    );
    if (id !== null) ids.add(id);
  }

  if (
    n.type === "block" &&
    typeof n.fields === "object" &&
    n.fields !== null
  ) {
    const fields = n.fields as Record<string, unknown>;
    if (fields.blockType === "imageGallery" && Array.isArray(fields.images)) {
      for (const imgEntry of fields.images as unknown[]) {
        if (typeof imgEntry === "object" && imgEntry !== null) {
          const id = resolveId((imgEntry as Record<string, unknown>).image);
          if (id !== null) ids.add(id);
        }
      }
    }
  }

  if (Array.isArray(n.children)) {
    for (const child of n.children) {
      walkLexicalNode(child, ids);
    }
  }
}

/**
 * Walk the top-level Lexical root object (serialised rich-text JSON).
 */
function extractMediaIdsFromLexical(
  content: unknown,
  ids: Set<string>,
): void {
  if (content === null || typeof content !== "object") return;
  const root = content as Record<string, unknown>;
  // Lexical stores the tree under `root`
  walkLexicalNode(root.root ?? content, ids);
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

type PagedQuery<T> = (page: number) => Promise<{
  docs: T[];
  totalPages: number;
}>;

async function collectPaged<T>(query: PagedQuery<T>): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const { docs, totalPages } = await query(page);
    results.push(...docs);
    if (page >= totalPages) break;
    page++;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Reference collection
// ---------------------------------------------------------------------------

/**
 * Collect every media ID that is referenced anywhere in the database.
 * Exported for unit-testing.
 */
export async function collectReferencedMediaIds(
  payload: Payload,
): Promise<Set<string>> {
  const ids = new Set<string>();

  // Helper: add resolved ID from a generic doc field
  const addField = (doc: unknown, field: string): void => {
    const id = resolveId((doc as Record<string, unknown>)[field]);
    if (id !== null) ids.add(id);
  };

  // ------------------------------------------------------------------
  // 1. posts.coverImage  (scan drafts too)
  // ------------------------------------------------------------------
  await collectPaged((page) =>
    payload.find({
      collection: "posts",
      depth: 0,
      draft: true,
      limit: 100,
      page,
      select: { coverImage: true },
    }),
  ).then((docs) => {
    for (const doc of docs) addField(doc, "coverImage");
  });

  // ------------------------------------------------------------------
  // 2. posts.content  (rich-text walk — upload nodes & imageGallery blocks)
  //    Also scan drafts so draft-only images aren't flagged as orphaned.
  // ------------------------------------------------------------------
  await collectPaged((page) =>
    payload.find({
      collection: "posts",
      depth: 0,
      draft: true,
      limit: 100,
      page,
      select: { content: true },
    }),
  ).then((docs) => {
    for (const doc of docs) {
      extractMediaIdsFromLexical((doc as Record<string, unknown>).content, ids);
    }
  });

  // ------------------------------------------------------------------
  // 3. projects.image  (scan drafts too)
  // ------------------------------------------------------------------
  await collectPaged((page) =>
    payload.find({
      collection: "projects",
      depth: 0,
      draft: true,
      limit: 100,
      page,
      select: { image: true },
    }),
  ).then((docs) => {
    for (const doc of docs) addField(doc, "image");
  });

  // ------------------------------------------------------------------
  // 4. users.avatar
  // ------------------------------------------------------------------
  await collectPaged((page) =>
    payload.find({
      collection: "users",
      depth: 0,
      limit: 100,
      page,
      select: { avatar: true },
    }),
  ).then((docs) => {
    for (const doc of docs) addField(doc, "avatar");
  });

  // ------------------------------------------------------------------
  // 5. site-settings.profileImage  (global)
  // ------------------------------------------------------------------
  try {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
    });
    const id = resolveId(
      (siteSettings as unknown as Record<string, unknown>).profileImage,
    );
    if (id !== null) ids.add(id);
  } catch {
    // Global may not be initialised yet — ignore
  }

  // ------------------------------------------------------------------
  // 6. SEO meta.image — collections (posts, projects, series) with drafts
  // ------------------------------------------------------------------
  const seoCollections = ["posts", "projects", "series"] as const;
  for (const col of seoCollections) {
    await collectPaged((page) =>
      payload.find({
        collection: col,
        depth: 0,
        draft: true,
        limit: 100,
        page,
        select: { meta: true },
      }),
    ).then((docs) => {
      for (const doc of docs) {
        const meta = (doc as Record<string, unknown>).meta;
        if (meta && typeof meta === "object") {
          const id = resolveId((meta as Record<string, unknown>).image);
          if (id !== null) ids.add(id);
        }
      }
    });
  }

  // ------------------------------------------------------------------
  // 7. SEO meta.image — globals
  // ------------------------------------------------------------------
  const seoGlobalSlugs = [
    "home-page",
    "cv-page",
    "blog-page",
    "series-page",
    "projects-page",
    "not-found-page",
  ] as const;

  for (const slug of seoGlobalSlugs) {
    try {
      const globalDoc = await payload.findGlobal({ slug, depth: 0 });
      const meta = (globalDoc as unknown as Record<string, unknown>).meta;
      if (meta && typeof meta === "object") {
        const id = resolveId((meta as Record<string, unknown>).image);
        if (id !== null) ids.add(id);
      }
    } catch {
      // Global may not exist yet — ignore
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Find all media documents that are not referenced anywhere in the database.
 */
export async function findOrphanedMedia(
  payload: Payload,
): Promise<OrphanedMediaResult> {
  // Collect all media + referenced IDs in parallel
  const [allMediaDocs, referencedIds] = await Promise.all([
    collectPaged<{
      id: string;
      filename?: string | null;
      alt?: string | null;
      url?: string | null;
      createdAt: string;
    }>((page) =>
      // We need the raw paginated result; use `as unknown` to avoid fighting
      // Payload's generic return type (Media has `id: string` which is correct
      // but the generic select return type is overly broad).
      payload
        .find({
          collection: "media",
          depth: 0,
          limit: 100,
          page,
          select: {
            id: true,
            filename: true,
            alt: true,
            url: true,
            createdAt: true,
          },
        })
        .then((result) => ({
          docs: result.docs.map((doc) => ({
            id: doc.id,
            filename: doc.filename ?? null,
            alt: doc.alt,
            url: doc.url ?? null,
            createdAt: doc.createdAt,
          })),
          totalPages: result.totalPages,
        })),
    ),
    collectReferencedMediaIds(payload),
  ]);

  const totalMedia = allMediaDocs.length;
  const totalReferenced = referencedIds.size;

  const orphaned: OrphanedMediaItem[] = allMediaDocs
    .filter((doc) => !referencedIds.has(doc.id))
    .map((doc) => ({
      id: doc.id,
      filename: doc.filename ?? null,
      alt: doc.alt ?? null,
      url: doc.url ?? null,
      createdAt: doc.createdAt,
    }));

  return { orphaned, totalMedia, totalReferenced };
}
