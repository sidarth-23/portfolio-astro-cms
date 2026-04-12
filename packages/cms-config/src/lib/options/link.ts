import { defineOptions } from "./utils";

export const LINK_TYPE_OPTIONS = defineOptions([
  { label: "Custom URL", value: "custom" },
  { label: "Reference", value: "reference" },
]);

export type LinkType = (typeof LINK_TYPE_OPTIONS)[number]["value"];
