import type { Block } from "payload";

import { createBasicRichTextEditor } from "@sidshub/lexical/cms";

export type CalloutVariantProfile = "generic" | "blog";

type CalloutVariantOption = {
  label: string;
  value: string;
};

const CALLOUT_VARIANTS_BY_PROFILE: Record<CalloutVariantProfile, CalloutVariantOption[]> = {
  generic: [
    { label: "Neutral", value: "neutral" },
    { label: "Info", value: "info" },
    { label: "Success", value: "success" },
    { label: "Warning", value: "warning" },
    { label: "Danger", value: "danger" },
  ],
  blog: [
    { label: "Note", value: "note" },
    { label: "Tip", value: "tip" },
    { label: "Warning", value: "warning" },
    { label: "Danger", value: "danger" },
  ],
};

const defaultVariantByProfile: Record<CalloutVariantProfile, string> = {
  generic: "neutral",
  blog: "note",
};

export const createCalloutBlock = (profile: CalloutVariantProfile = "generic"): Block => {
  return {
    slug: "callout",
    interfaceName: "CalloutBlock",
    fields: [
      {
        name: "variant",
        type: "select",
        required: true,
        defaultValue: defaultVariantByProfile[profile],
        options: CALLOUT_VARIANTS_BY_PROFILE[profile],
      },
      {
        name: "title",
        type: "text",
        required: false,
      },
      {
        name: "content",
        type: "richText",
        required: true,
        editor: createBasicRichTextEditor(),
      },
    ],
  };
};

export const CalloutBlock = createCalloutBlock("generic");
