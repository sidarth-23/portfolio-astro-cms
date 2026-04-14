import type { CollectionAfterReadHook } from "payload";

import type { User } from "../payload-types";

type AuthorLink = NonNullable<User["links"]>[number];

type PopulatedAuthor = {
  id: string;
  name?: string | null;
  bio?: User["bio"];
  avatar?: User["avatar"];
  links?: Array<Pick<AuthorLink, "icon" | "url" | "newTab">>;
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
        id: String(authorDoc.id),
        name: authorDoc.name,
        bio: authorDoc.bio,
        avatar: authorDoc.avatar,
        links: Array.isArray(authorDoc.links)
          ? authorDoc.links.map((link) => ({
              icon: link.icon,
              url: link.url,
              newTab: link.newTab,
            }))
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
