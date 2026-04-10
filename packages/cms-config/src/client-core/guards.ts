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
} from "../payload-types";
import type { PopulatedAuthor, RelationValue, SiteFooterItem } from "./types";
import { normalizeFooterItemType, resolveFooterLink } from "./footerLinks";

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

export const asSiteFooterItems = (value: SiteSetting["sidebarFooterItems"]): SiteFooterItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const type = normalizeFooterItemType(item?.type);
    if (!type) {
      return [];
    }

    const rawValue = typeof item?.url === "string" ? item.url : "";
    const resolved = resolveFooterLink(type, rawValue);
    if (!resolved) {
      return [];
    }

    return [{ type, ...resolved }];
  });
};
