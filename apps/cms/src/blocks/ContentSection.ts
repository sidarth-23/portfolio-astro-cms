import type { Block } from "payload";

import { createBasicRichTextEditor } from "@cms/lib/editor";

export const ContentSectionBlock: Block = {
  slug: "contentSection",
  interfaceName: "ContentSectionBlock",
  fields: [
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
