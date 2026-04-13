import type { CollectionAfterChangeHook } from "payload";

import type { Post } from "../payload-types";

const relationToPostId = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as { id?: unknown };
    if (typeof candidate.id === "number") {
      return candidate.id;
    }
  }

  return null;
};

const extractPostIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<number>();
  for (const entry of value) {
    const postId = relationToPostId(entry);
    if (postId !== null) {
      seen.add(postId);
    }
  }

  return Array.from(seen);
};

const relationToSeriesId = (value: unknown): number | null => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as { id?: unknown };
    if (typeof candidate.id === "number") {
      return candidate.id;
    }
  }

  return null;
};

export const syncSeriesPostsToPosts: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const currentPostIds = new Set(extractPostIds(doc?.posts));
  const previousPostIds = new Set(extractPostIds(previousDoc?.posts));

  const addedPostIds = Array.from(currentPostIds).filter((postId) => !previousPostIds.has(postId));
  const removedPostIds = Array.from(previousPostIds).filter((postId) => !currentPostIds.has(postId));

  for (const postId of addedPostIds) {
    await req.payload.update({
      collection: "posts",
      id: postId,
      data: {
        series: doc.id,
      },
      depth: 0,
      overrideAccess: true,
      req,
    });
  }

  for (const postId of removedPostIds) {
    const post = await req.payload.findByID({
      collection: "posts",
      id: postId,
      depth: 0,
      overrideAccess: true,
      req,
    });

    if (!post) {
      continue;
    }

    const postSeriesId = relationToSeriesId((post as Post).series);
    if (postSeriesId !== doc.id) {
      continue;
    }

    await req.payload.update({
      collection: "posts",
      id: postId,
      data: {
        series: null,
      },
      depth: 0,
      overrideAccess: true,
      req,
    });
  }

  return doc;
};
