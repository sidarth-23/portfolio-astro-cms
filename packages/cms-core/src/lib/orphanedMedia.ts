import type { Payload } from "payload";
import { SEO_COLLECTIONS, SEO_GLOBALS } from "../registry";

// Folder names used by the OG image plugin for generated images.
// Keep in sync with ogImagePlugin's defaultFolderName option in builder.ts.
const OG_FOLDER_NAMES = ["Auto Generated"];

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
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "id" in (value as object)) {
    const id = (value as Record<string, unknown>).id;
    if (typeof id === "string") return id;
    if (typeof id === "number") return String(id);
  }
  return null;
}

const getMappedOgFolderNames = (): string[] => OG_FOLDER_NAMES;

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
    const id = resolveId((n.value as Record<string, unknown> | undefined)?.id);
    if (id !== null) ids.add(id);
  }

  if (n.type === "block" && typeof n.fields === "object" && n.fields !== null) {
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
function extractMediaIdsFromLexical(content: unknown, ids: Set<string>): void {
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
export async function collectReferencedMediaIds(payload: Payload): Promise<Set<string>> {
  const referencedIds = new Set<string>();

  // Helper: merge a partial Set into the shared referencedIds set
  const merge = (partial: Set<string>): void => {
    for (const id of partial) referencedIds.add(id);
  };

  // Helper: add resolved ID from a generic doc field into a local Set
  const addField = (ids: Set<string>, doc: unknown, field: string): void => {
    const id = resolveId((doc as Record<string, unknown>)[field]);
    if (id !== null) ids.add(id);
  };

  // ------------------------------------------------------------------
  // 1. posts — coverImage + content (single scan, both fields together)
  //    Also scan drafts so draft-only images aren't flagged as orphaned.
  // ------------------------------------------------------------------
  const scanPosts = collectPaged((page) =>
    payload.find({
      collection: "posts",
      depth: 0,
      draft: true,
      limit: 100,
      page,
    }),
  ).then((docs) => {
    const ids = new Set<string>();
    for (const doc of docs) {
      addField(ids, doc, "coverImage");
      extractMediaIdsFromLexical(doc.content, ids);
    }
    return ids;
  });

  // ------------------------------------------------------------------
  // 2. projects.coverImage  (scan drafts too)
  // ------------------------------------------------------------------
  const scanProjects = collectPaged((page) =>
    payload.find({
      collection: "projects",
      depth: 0,
      draft: true,
      limit: 100,
      page,
      select: { coverImage: true },
    }),
  ).then((docs) => {
    const ids = new Set<string>();
    for (const doc of docs) addField(ids, doc, "coverImage");
    return ids;
  });

  // ------------------------------------------------------------------
  // 3. users.avatar
  // ------------------------------------------------------------------
  const scanUsers = collectPaged((page) =>
    payload.find({
      collection: "users",
      depth: 0,
      limit: 100,
      page,
      select: { avatar: true },
    }),
  ).then((docs) => {
    const ids = new Set<string>();
    for (const doc of docs) addField(ids, doc, "avatar");
    return ids;
  });

  // ------------------------------------------------------------------
  // 4. site-settings.profileImage  (global)
  // ------------------------------------------------------------------
  const scanSiteSettings = (async () => {
    const ids = new Set<string>();
    try {
      const siteSettings = await payload.findGlobal({
        slug: "site-settings",
        depth: 0,
      });
      const id = resolveId(siteSettings.profileImage);
      if (id !== null) ids.add(id);
    } catch {
      // Global may not be initialised yet — ignore
    }
    return ids;
  })();

  // Run all main collection/global scans concurrently
  const [postsIds, projectsIds, usersIds, siteSettingsIds] = await Promise.all([
    scanPosts,
    scanProjects,
    scanUsers,
    scanSiteSettings,
  ]);
  merge(postsIds);
  merge(projectsIds);
  merge(usersIds);
  merge(siteSettingsIds);

  // ------------------------------------------------------------------
  // 5. SEO meta.image — collections (posts, projects, series) with drafts
  // ------------------------------------------------------------------
  const seoCollectionResults = await Promise.all(
    SEO_COLLECTIONS.map((col) =>
      collectPaged((page) =>
        payload.find({
          collection: col,
          depth: 0,
          draft: true,
          limit: 100,
          page,
          select: { meta: true },
        }),
      ).then((docs) => {
        const ids = new Set<string>();
        for (const doc of docs) {
          const meta = (doc as Record<string, unknown>).meta;
          if (meta && typeof meta === "object") {
            const id = resolveId((meta as Record<string, unknown>).image);
            if (id !== null) ids.add(id);
          }
        }
        return ids;
      }),
    ),
  );
  for (const ids of seoCollectionResults) merge(ids);

  // ------------------------------------------------------------------
  // 6. SEO meta.image — globals
  // ------------------------------------------------------------------
  const seoGlobalResults = await Promise.all(
    SEO_GLOBALS.map(async (slug) => {
      const ids = new Set<string>();
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
      return ids;
    }),
  );
  for (const ids of seoGlobalResults) merge(ids);

  // ------------------------------------------------------------------
  // 7. Media in configured OG folders are considered referenced
  // ------------------------------------------------------------------
  const folderNames = getMappedOgFolderNames();
  if (folderNames.length > 0) {
    const folderDocs = await payload.find({
      collection: "payload-folders",
      depth: 0,
      pagination: false,
      limit: 0,
      where: {
        name: {
          in: folderNames,
        },
      },
    });

    const folderIds = folderDocs.docs
      .map((doc) => resolveId(doc.id))
      .filter((id): id is string => id !== null);

    if (folderIds.length > 0) {
      const folderMediaIds = await collectPaged((page) =>
        payload
          .find({
            collection: "media",
            depth: 0,
            limit: 100,
            page,
            where: {
              folder: {
                in: folderIds,
              },
            },
          })
          .then((result) => ({
            docs: result.docs
              .map((doc) => resolveId(doc.id))
              .filter((id): id is string => id !== null),
            totalPages: result.totalPages,
          })),
      );

      for (const id of folderMediaIds) {
        referencedIds.add(id);
      }
    }
  }

  return referencedIds;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Find all media documents that are not referenced anywhere in the database.
 */
export async function findOrphanedMedia(payload: Payload): Promise<OrphanedMediaResult> {
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
            id: String(doc.id),
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

  const orphaned: OrphanedMediaItem[] = allMediaDocs
    .filter((doc) => !referencedIds.has(doc.id))
    .map((doc) => ({
      id: doc.id,
      filename: doc.filename ?? null,
      alt: doc.alt ?? null,
      url: doc.url ?? null,
      createdAt: doc.createdAt,
    }));

  return { orphaned, totalMedia };
}
