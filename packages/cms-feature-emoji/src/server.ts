import { createServerFeature } from "@payloadcms/richtext-lexical";

import { EMOJI_SHORTCODE_TRANSFORMER } from "./transformers/emojiShortcode";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "./client";

export const EmojiFeature = createServerFeature({
  key: "emoji",
  feature: {
    ClientFeature: "@sidshub/cms-feature-emoji/client#EmojiFeatureClient",
    markdownTransformers: [EMOJI_SHORTCODE_TRANSFORMER],
  },
});
