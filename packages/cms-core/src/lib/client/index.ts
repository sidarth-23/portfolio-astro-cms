export { createCmsClient } from "./createCmsClient";
export type { CmsClient, HomeCtaButton } from "./createCmsClient";

export {
  asCategory,
  asMedia,
  asPopulatedAuthors,
  asProjectArray,
  asSeries,
  asSiteFooterItems,
  asUserArray,
  isObjectRelation,
} from "./guards";

export type {
  CategoryInfo,
  PaginatedPosts,
  PopulatedAuthor,
  PostFilterOptions,
  ProjectLink,
  PublishedPostsQueryOptions,
  RelationValue,
  SeriesInfo,
  SeriesStaticPathData,
  SiteFooterItem,
  TagInfo,
} from "./types";
