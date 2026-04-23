import { createServerFeature } from "@payloadcms/richtext-lexical";

// Force tsdown to emit the client module even though Payload resolves it from a string path.
import "@/plugin/emoji-shortcodes/client";

export const EmojiShortcodesFeature = createServerFeature({
  key: "emojiShortcodes",
  feature: {
    ClientFeature: "./plugin/emoji-shortcodes/client#EmojiShortcodesFeatureClient",
  },
});
