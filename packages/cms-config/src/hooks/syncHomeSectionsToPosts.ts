import type { GlobalAfterChangeHook } from "payload";

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

const accumulatePostSectionNames = (sections: unknown): Map<number, string[]> => {
  const postToSectionNames = new Map<number, string[]>();

  if (!Array.isArray(sections)) {
    return postToSectionNames;
  }

  for (const section of sections) {
    if (typeof section !== "object" || section === null) {
      continue;
    }

    const sectionRecord = section as { name?: unknown; posts?: unknown };
    const sectionName = typeof sectionRecord.name === "string" ? sectionRecord.name.trim() : "";
    if (!sectionName || !Array.isArray(sectionRecord.posts)) {
      continue;
    }

    for (const postRelation of sectionRecord.posts) {
      const postId = relationToPostId(postRelation);
      if (postId === null) {
        continue;
      }

      const existing = postToSectionNames.get(postId) || [];
      if (!existing.includes(sectionName)) {
        existing.push(sectionName);
      }
      postToSectionNames.set(postId, existing);
    }
  }

  return postToSectionNames;
};

export const syncHomeSectionsToPosts: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const currentSections = (doc as { featuredSections?: unknown } | null | undefined)?.featuredSections;
  const previousSections = (previousDoc as { featuredSections?: unknown } | null | undefined)?.featuredSections;

  const currentMap = accumulatePostSectionNames(currentSections);
  const previousMap = accumulatePostSectionNames(previousSections);

  const affectedPostIds = new Set<number>([...currentMap.keys(), ...previousMap.keys()]);

  for (const postId of affectedPostIds) {
    const sectionNames = currentMap.get(postId) || [];
    const summary = sectionNames.length > 0 ? sectionNames.join(", ") : null;

    await req.payload.update({
      collection: "posts",
      id: postId,
      data: {
        homeSectionsSummary: summary,
      },
      depth: 0,
      overrideAccess: true,
      req,
    });
  }

  return doc;
};
