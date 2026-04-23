"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { $getSelection, $isRangeSelection, TextNode } from "lexical";
import { gemoji } from "gemoji";

const shortcodeToEmoji = new Map<string, string>();

for (const entry of gemoji) {
  for (const name of entry.names) {
    shortcodeToEmoji.set(name.toLowerCase(), entry.emoji);
  }

  for (const tag of entry.tags) {
    if (!shortcodeToEmoji.has(tag.toLowerCase())) {
      shortcodeToEmoji.set(tag.toLowerCase(), entry.emoji);
    }
  }
}

const isShortcodeChar = (value: string): boolean => {
  const code = value.charCodeAt(0);
  const isLower = code >= 97 && code <= 122;
  const isUpper = code >= 65 && code <= 90;
  const isDigit = code >= 48 && code <= 57;
  return isLower || isUpper || isDigit || value === "_" || value === "+" || value === "-";
};

const replaceEmojiShortcodes = (input: string): string => {
  if (!input.includes(":")) {
    return input;
  }

  let cursor = 0;
  let output = "";
  let changed = false;

  while (cursor < input.length) {
    const start = input.indexOf(":", cursor);

    if (start < 0) {
      output += input.slice(cursor);
      break;
    }

    output += input.slice(cursor, start);

    const end = input.indexOf(":", start + 1);

    if (end < 0) {
      output += input.slice(start);
      break;
    }

    const shortcode = input.slice(start + 1, end);

    if (shortcode.length > 0 && Array.from(shortcode).every((char) => isShortcodeChar(char))) {
      const emoji = shortcodeToEmoji.get(shortcode.toLowerCase());

      if (emoji) {
        output += emoji;
        changed = true;
        cursor = end + 1;
        continue;
      }
    }

    output += input.slice(start, end + 1);
    cursor = end + 1;
  }

  return changed ? output : input;
};

function EmojiShortcodesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (textNode) => {
      if (!textNode.isSimpleText() || textNode.hasFormat("code")) {
        return;
      }

      const original = textNode.getTextContent();

      if (!original.includes(":")) {
        return;
      }

      const next = replaceEmojiShortcodes(original);

      if (next !== original) {
        const selection = $getSelection();
        const key = textNode.getKey();
        const nextLength = next.length;

        const anchorNeedsClamp =
          $isRangeSelection(selection) &&
          selection.anchor.type === "text" &&
          selection.anchor.key === key;
        const focusNeedsClamp =
          $isRangeSelection(selection) &&
          selection.focus.type === "text" &&
          selection.focus.key === key;

        const anchorOffset = anchorNeedsClamp
          ? Math.min(selection.anchor.offset, nextLength)
          : null;
        const focusOffset = focusNeedsClamp ? Math.min(selection.focus.offset, nextLength) : null;

        textNode.setTextContent(next);

        if ($isRangeSelection(selection)) {
          if (anchorOffset !== null) {
            selection.anchor.set(key, anchorOffset, "text");
          }

          if (focusOffset !== null) {
            selection.focus.set(key, focusOffset, "text");
          }
        }
      }
    });
  }, [editor]);

  return null;
}

export const EmojiShortcodesFeatureClient = createClientFeature({
  plugins: [
    {
      Component: EmojiShortcodesPlugin,
      position: "normal",
    },
  ],
});
