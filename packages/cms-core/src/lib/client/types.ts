import type { Media, User } from "@/payload-types";

export type RelationValue<T> = string | number | T | null | undefined;

export type PopulatedAuthor = {
  id?: string | number | null;
  name?: string | null;
  bio?: User["bio"];
  avatar?: RelationValue<Media>;
  links?: Array<{ icon?: string | null; url?: string | null; newTab?: boolean | null }> | null;
};

export type ProjectLink = {
  icon: string;
  url: string;
  newTab: boolean;
};

export type SiteFooterItem = {
  icon: string;
  url: string;
  newTab: boolean;
};
