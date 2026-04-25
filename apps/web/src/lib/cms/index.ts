import { createMediaUrlResolver } from "@sidshub/cms-core/client/media";
import { createTransport } from "./transport";
import { createGlobalCache } from "./cache";
import { createCmsQueries } from "./queries";
import { createCmsHelpers } from "./helpers";

const transport = await createTransport();
const mediaToUrl = createMediaUrlResolver(transport.mediaBaseUrl);
const getCachedGlobal = createGlobalCache();
const queries = createCmsQueries(transport, getCachedGlobal);
const helpers = createCmsHelpers(transport, mediaToUrl);

export const cmsClient = { ...queries, ...helpers, mediaToUrl };

export type {
  TagInfo,
  CategoryInfo,
  SeriesInfo,
  SeriesStaticPathData,
  HomeCtaButton,
  PaginatedPosts,
  PostFilterOptions,
} from "./types";
