import { defineOptions } from "./utils";

export type CalloutVariantProfile = "generic" | "blog";

export const CALLOUT_VARIANTS_BY_PROFILE = {
  generic: defineOptions([
    { label: "Neutral", value: "neutral" },
    { label: "Info", value: "info" },
    { label: "Success", value: "success" },
    { label: "Warning", value: "warning" },
    { label: "Danger", value: "danger" },
  ]),
  blog: defineOptions([
    { label: "Note", value: "note" },
    { label: "Tip", value: "tip" },
    { label: "Warning", value: "warning" },
    { label: "Danger", value: "danger" },
  ]),
} satisfies Record<CalloutVariantProfile, Array<{ label: string; value: string }>>;

export const CALLOUT_DEFAULT_VARIANT_BY_PROFILE: Record<CalloutVariantProfile, string> = {
  generic: "neutral",
  blog: "note",
};
