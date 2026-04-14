import type {
  Category,
  Media,
  Post,
  Project,
  ProjectsPage,
  Series,
  User,
} from "../../payload-types";
import type { PopulatedAuthor, RelationValue, SiteFooterItem } from "./types";

export const isObjectRelation = <T extends object>(value: RelationValue<T>): value is T => {
  return typeof value === "object" && value !== null;
};

export const asMedia = (value: RelationValue<Media>): Media | undefined => {
  return isObjectRelation<Media>(value) ? value : undefined;
};

export const asCategory = (value: RelationValue<Category>): Category | undefined => {
  return isObjectRelation<Category>(value) ? value : undefined;
};

export const asSeries = (value: unknown): Series | undefined => {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "object" && first !== null ? (first as Series) : undefined;
  }

  if (typeof value !== "object" || value === null) return undefined;
  // Payload join field shape: { docs?: T[], hasNextPage?: boolean }
  if ("docs" in value) {
    const first = (value as { docs?: unknown[] }).docs?.[0];
    return typeof first === "object" && first !== null ? (first as Series) : undefined;
  }
  return value as Series;
};

export const asUserArray = (value: Post["authors"]): User[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((author): author is User => isObjectRelation<User>(author));
};

const isPopulatedAuthor = (value: unknown): value is PopulatedAuthor => {
  return typeof value === "object" && value !== null;
};

export const asPopulatedAuthors = (value: Post["populatedAuthors"]): PopulatedAuthor[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPopulatedAuthor);
};

export const asProjectArray = (value: ProjectsPage["sections"][number]["projects"]): Project[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((project): project is Project => isObjectRelation<Project>(project));
};

export const asSiteFooterItems = (value: unknown): SiteFooterItem[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const icon = typeof item?.icon === "string" ? item.icon.trim() : "";
    const url = typeof item?.url === "string" ? item.url.trim() : "";
    if (!icon || !url) return [];
    return [{ icon, url, newTab: item?.newTab === true }];
  });
};
