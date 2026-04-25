import type { Block } from "payload";
import { createBasicRichTextEditor } from "@/lib/editor";
import {
  CALLOUT_DEFAULT_VARIANT_BY_PROFILE,
  CALLOUT_VARIANTS_BY_PROFILE,
  type CalloutVariantProfile,
} from "@/lib/content";

export const createCalloutBlock = (profile: CalloutVariantProfile = "generic"): Block => {
  return {
    slug: "callout",
    interfaceName: "CalloutBlock",
    fields: [
      {
        name: "variant",
        type: "select",
        required: true,
        defaultValue: CALLOUT_DEFAULT_VARIANT_BY_PROFILE[profile],
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
