import type {
  Category,
  Media,
  Post,
  Project,
  ProjectsPage,
  Series,
  User,
} from "@sidshub/cms/payload-types";

export type RelationID = number | string;
export type RelationValue<T> = RelationID | T | null | undefined;
export type PopulatedAuthor = NonNullable<Post["populatedAuthors"]>[number];

export const isRelationID = (value: unknown): value is RelationID =>
  typeof value === "number" || typeof value === "string";

export const isObjectRelation = <T extends object>(value: RelationValue<T>): value is T =>
  typeof value === "object" && value !== null;

export const asCategory = (value: RelationValue<Category>): Category | undefined =>
  isObjectRelation<Category>(value) ? value : undefined;
export const asMedia = (value: RelationValue<Media>): Media | undefined =>
  isObjectRelation<Media>(value) ? value : undefined;

export const asSeries = (value: unknown): Series | undefined => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "object" && first !== null ? (first as Series) : undefined;
  }

  if (typeof value !== "object" || value === null) return undefined;
  if ("docs" in value) {
    const first = (value as { docs?: unknown[] }).docs?.[0];
    return typeof first === "object" && first !== null ? (first as Series) : undefined;
  }
  return value as Series;
};

export const asUserArray = (value: Post["authors"]): User[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((author): author is User => isObjectRelation<User>(author));
};

export const asPopulatedAuthors = (value: Post["populatedAuthors"]): PopulatedAuthor[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (author): author is PopulatedAuthor => typeof author === "object" && author !== null,
  );
};

export const asProjectArray = (value: ProjectsPage["sections"][number]["projects"]): Project[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((project): project is Project => isObjectRelation<Project>(project));
};
