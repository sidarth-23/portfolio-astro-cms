import type { CollectionAfterReadHook } from "payload";

import type { User } from "@sidshub/cms-types/payload-types";

type PopulatedAuthor = {
  id: number;
  name?: string | null;
  bio?: User["bio"];
  avatar?: User["avatar"];
  linkedInUrl?: string | null;
  githubUrl?: string | null;
};

export const populateAuthors: CollectionAfterReadHook = async ({ doc, req: { payload } }) => {
  const authors = Array.isArray(doc?.authors) ? doc.authors : [];

  if (!authors.length) {
    return doc;
  }

  const populatedAuthors: PopulatedAuthor[] = [];

  for (const author of authors) {
    try {
      const authorDoc =
        typeof author === "object" && author !== null
          ? (author as User)
          : await payload.findByID({
              collection: "users",
              id: author,
              depth: 1,
              overrideAccess: true,
            });

      if (!authorDoc) {
        continue;
      }

      populatedAuthors.push({
        id: authorDoc.id,
        name: authorDoc.name,
        bio: authorDoc.bio,
        avatar: authorDoc.avatar,
        linkedInUrl: authorDoc.linkedInUrl,
        githubUrl: authorDoc.githubUrl,
      });
    } catch {
      // no-op: skip inaccessible/missing users
    }
  }

  return {
    ...doc,
    populatedAuthors,
  };
};
