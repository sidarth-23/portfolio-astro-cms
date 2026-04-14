import type { CollectionAfterReadHook } from "payload";

import type { User } from "../payload-types";

type PopulatedAuthor = {
  id: number | string;
  name?: string | null;
  bio?: User["bio"];
  avatar?: User["avatar"];
  links?: Array<{ icon?: string | null; url?: string | null; newTab?: boolean | null }>;
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

      // `links` is not yet in payload-types.ts (pending migration); cast via unknown
      const authorLinks = (authorDoc as unknown as { links?: unknown }).links;
      populatedAuthors.push({
        id: authorDoc.id,
        name: authorDoc.name,
        bio: authorDoc.bio,
        avatar: authorDoc.avatar,
        links: Array.isArray(authorLinks)
          ? (authorLinks as Array<{ icon?: string | null; url?: string | null; newTab?: boolean | null }>)
          : undefined,
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
