import { createMediaUrlResolver, createMediaSizeUrlResolver } from "./media";
import { createTransport } from "./transport";
import { createGlobalCache } from "./cache";
import { createCmsQueries } from "./queries";
import { createCmsHelpers } from "./helpers";

const { query, mediaBaseUrl, siteUrl } = await createTransport();
const mediaToUrl = createMediaUrlResolver(mediaBaseUrl);
const mediaSizeUrl = createMediaSizeUrlResolver(mediaBaseUrl);
const getCachedGlobal = createGlobalCache();
const queries = createCmsQueries(query, getCachedGlobal);
const helpers = createCmsHelpers(siteUrl, mediaToUrl);

export const cmsClient = { ...queries, ...helpers, mediaToUrl, mediaSizeUrl, mediaBaseUrl };
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
