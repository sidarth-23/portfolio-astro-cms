"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { EMOJI_SHORTCODE_TRANSFORMER } from "@/plugin/emoji-shortcodes/transformer";

export const EmojiShortcodesFeatureClient = createClientFeature({
  markdownTransformers: [EMOJI_SHORTCODE_TRANSFORMER],
});
