export { createCmsClient } from "./createCmsClient";
export type { CmsClient } from "./createCmsClient";

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
  PaginatedPosts,
  PopulatedAuthor,
  PostFilterOptions,
  ProjectLink,
  PublishedPostsQueryOptions,
  RelationValue,
  SiteFooterItem,
} from "./types";
