import { type TextMatchTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import { shortcodeToEmoji } from "../data/shortcodeMap";

export const EMOJI_SHORTCODE_TRANSFORMER: TextMatchTransformer = {
  dependencies: [],
  type: "text-match",
  importRegExp: /:([a-z0-9_+-]+):/i,
  regExp: /:([a-z0-9_+-]+):$/i,
  replace: (textNode, match) => {
    const shortcode = match[1]?.toLowerCase();

    if (!shortcode) {
      return;
    }

    const emoji = shortcodeToEmoji[shortcode];

    if (!emoji) {
      return;
    }

    textNode.setTextContent(emoji);
    return textNode;
  },
  trigger: ":",
};
