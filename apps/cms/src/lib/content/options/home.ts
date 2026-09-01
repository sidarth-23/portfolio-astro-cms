import { defineOptions } from "./utils";

export const HOME_CTA_VARIANT_OPTIONS = defineOptions([
  { label: "Default", value: "default" },
  { label: "Primary", value: "primary" },
  { label: "Secondary", value: "secondary" },
  { label: "Accent", value: "accent" },
  { label: "Outline", value: "outline" },
  { label: "Ghost", value: "ghost" },
]);

export type HomeCtaVariant = (typeof HOME_CTA_VARIANT_OPTIONS)[number]["value"];
