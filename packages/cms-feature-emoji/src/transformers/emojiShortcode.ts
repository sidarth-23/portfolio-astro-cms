import { type TextMatchTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";
import { nameToEmoji } from "gemoji";

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

    const emoji = nameToEmoji[shortcode];

    if (!emoji) {
      return;
    }

    textNode.setTextContent(emoji);
    return textNode;
  },
  trigger: ":",
};
