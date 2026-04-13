import type { Block } from "payload";

import { createBasicRichTextEditor } from "@sidshub/cms-editor/cms";

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
