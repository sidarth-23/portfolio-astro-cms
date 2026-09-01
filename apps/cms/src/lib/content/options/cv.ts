import { defineOptions } from "./utils";

export const CV_SECTION_ITEM_TYPE_OPTIONS = defineOptions([
  { label: "Generic", value: "generic" },
  { label: "Organization Role (e.g. Experience)", value: "organizationRole" },
  { label: "Linked (e.g. Certificate)", value: "linked" },
]);

export type CvSectionItemType = (typeof CV_SECTION_ITEM_TYPE_OPTIONS)[number]["value"];

export const CV_SECTION_TYPE_OPTIONS = defineOptions([
  { label: "Description", value: "description" },
  { label: "Items", value: "items" },
  { label: "Badges", value: "badges" },
]);

export type CvSectionType = (typeof CV_SECTION_TYPE_OPTIONS)[number]["value"];

export const CV_ITEMS_VARIANT_OPTIONS = defineOptions([
  { label: "Timeline", value: "timeline" },
  { label: "List", value: "list" },
  { label: "Columns", value: "columns" },
]);

export type CvItemsVariant = (typeof CV_ITEMS_VARIANT_OPTIONS)[number]["value"];
