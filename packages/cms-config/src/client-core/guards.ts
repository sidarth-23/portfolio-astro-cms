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
import type { PopulatedAuthor, RelationValue, SiteFooterItem, SiteFooterItemType } from "./types";

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

const SITE_FOOTER_ITEM_TYPES: SiteFooterItemType[] = [
  "github",
  "linkedin",
  "email",
  "rss",
  "facebook",
  "twitter",
  "dribbble",
  "instagram",
  "youtube",
  "twitch",
  "tiktok",
  "medium",
  "whatsapp",
  "telegram",
  "discord",
  "reddit",
  "pinterest",
  "behance",
  "codepen",
  "gitlab",
  "stackoverflow",
  "devto",
];

const normalizeFooterItemType = (value: unknown): SiteFooterItemType | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s.]+/g, "");
  if (!normalized) {
    return undefined;
  }

  return SITE_FOOTER_ITEM_TYPES.find((type) => type === normalized);
};

export const asSiteFooterItems = (value: SiteSetting["sidebarFooterItems"]): SiteFooterItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const type = normalizeFooterItemType(item?.type);
    const url = typeof item?.url === "string" ? item.url.trim() : "";

    if (!type || url.length === 0) {
      return [];
    }

    return [{ ...item, type, url }];
  });
};
