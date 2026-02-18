import type { SiteSetting } from "@sidshub/cms-config/payload-types";

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type SiteFooterItem = NonNullable<SiteSetting["sidebarFooterItems"]>[number];
export type SiteFooterItemType = SiteFooterItem["type"];
