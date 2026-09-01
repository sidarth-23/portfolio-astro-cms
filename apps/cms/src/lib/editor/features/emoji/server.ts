import { createServerFeature } from "@payloadcms/richtext-lexical";

import { EMOJI_SHORTCODE_TRANSFORMER } from "./transformers/emojiShortcode";

export const EmojiFeature = createServerFeature({
  key: "emoji",
  feature: {
    ClientFeature: "./lib/editor/features/emoji/client#EmojiFeatureClient",
    markdownTransformers: [EMOJI_SHORTCODE_TRANSFORMER],
  },
});
