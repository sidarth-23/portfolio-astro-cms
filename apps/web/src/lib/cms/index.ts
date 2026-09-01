import { getCmsPayload } from "./payload";
import { createMediaUrlResolver, createMediaSizeUrlResolver } from "./media";
import { cmsCache } from "./cache";
import { createCmsQueries } from "./queries";
import {
  authorsFromPost,
  badgesFromProject,
  categoryFromPost,
  createSlug,
  featuredPostsFromHomeSection,
  featuredProjectsFromHomeSection,
  footerItemsFromSiteSettings,
  homeCtaButtons,
  linksFromProject,
  PAGE_ROUTE_MAP,
  resolveLinkUrl,
  resolvedBadgeGroupsFromCvSection,
  seriesFromPost,
  subtitleFromCvItem,
  tagsFromPost,
  tagsFromProject,
} from "./helpers";

const payload = await getCmsPayload();
const mediaBaseUrl =
  payload.config.serverURL ??
  process.env.S3_PUBLIC_URL ??
  process.env.PAYLOAD_PUBLIC_SERVER_URL ??
  "";
const siteUrl = typeof import.meta.env.SITE === "string" ? import.meta.env.SITE : undefined;
const mediaToUrl = createMediaUrlResolver(mediaBaseUrl);
const mediaSizeUrl = createMediaSizeUrlResolver(mediaBaseUrl);
const queries = createCmsQueries(payload, cmsCache);

export const cmsClient = {
  ...queries,
  mediaToUrl,
  mediaSizeUrl,
  mediaBaseUrl,
  createSlug,
  PAGE_ROUTE_MAP,
  resolveLinkUrl: (link: Parameters<typeof resolveLinkUrl>[0]) => resolveLinkUrl(link, siteUrl),
  homeCtaButtons: (page: Parameters<typeof homeCtaButtons>[0]) => homeCtaButtons(page, siteUrl),
  linksFromProject: (project: Parameters<typeof linksFromProject>[0]) =>
    linksFromProject(project, siteUrl),
  footerItemsFromSiteSettings: (settings: Parameters<typeof footerItemsFromSiteSettings>[0]) =>
    footerItemsFromSiteSettings(settings, siteUrl),
  categoryFromPost,
  tagsFromPost,
  seriesFromPost,
  authorsFromPost,
  badgesFromProject,
  tagsFromProject,
  featuredPostsFromHomeSection,
  featuredProjectsFromHomeSection,
  subtitleFromCvItem,
  resolvedBadgeGroupsFromCvSection,
};
export const cmsMediaBaseUrl = mediaBaseUrl;

export type {
  TagInfo,
  CategoryInfo,
  SeriesInfo,
  SeriesStaticPathData,
  HomeCtaButton,
  PaginatedPosts,
  PostFilterOptions,
} from "./types";
