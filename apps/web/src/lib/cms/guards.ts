import type {
  Category,
  Media,
  Post,
  Project,
  ProjectsPage,
  Series,
  SiteSetting,
  Tag,
  User,
} from "@sidshub/cms-config/payload-types";

type RelationValue<T> = number | T | null | undefined;

export const isObjectRelation = <T extends object>(value: RelationValue<T>): value is T => {
  return typeof value === "object" && value !== null;
};

export const asMedia = (value: RelationValue<Media>): Media | undefined => {
  return isObjectRelation<Media>(value) ? value : undefined;
};

export const asCategory = (value: RelationValue<Category>): Category | undefined => {
  return isObjectRelation<Category>(value) ? value : undefined;
};

export const asSeries = (value: RelationValue<Series>): Series | undefined => {
  return isObjectRelation<Series>(value) ? value : undefined;
};

export const asTagArray = (value: Post["tags"]): Tag[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((tag): tag is Tag => isObjectRelation<Tag>(tag));
};

export const asUserArray = (value: Post["authors"]): User[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((author): author is User => isObjectRelation<User>(author));
};

export type PopulatedAuthor = {
  id?: number | null;
  name?: string | null;
  bio?: User["bio"];
  avatar?: RelationValue<Media>;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
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

export type SiteFooterItem = NonNullable<SiteSetting["sidebarFooterItems"]>[number];
export type SiteFooterItemType = SiteFooterItem["type"];

export const asSiteFooterItems = (value: SiteSetting["sidebarFooterItems"]): SiteFooterItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is SiteFooterItem => Boolean(item?.type) && typeof item.url === "string");
};
