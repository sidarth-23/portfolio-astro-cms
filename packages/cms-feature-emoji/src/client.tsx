"use client";

import {
  createClientFeature,
  slashMenuBasicGroupWithItems,
  toolbarFeatureButtonsGroupWithItems,
} from "@payloadcms/richtext-lexical/client";

import { OPEN_EMOJI_PICKER_COMMAND } from "./plugins/emojiPickerCommand";
import { EmojiPickerPlugin } from "./plugins/EmojiPickerPlugin";
import { EMOJI_SHORTCODE_TRANSFORMER } from "./transformers/emojiShortcode";

function EmojiToolbarIcon() {
  return (
    <span
      aria-hidden="true"
      className="icon"
      style={{ alignItems: "center", display: "inline-flex" }}
    >
      😀
    </span>
  );
}

export const EmojiFeatureClient = createClientFeature({
  markdownTransformers: [EMOJI_SHORTCODE_TRANSFORMER],
  toolbarFixed: {
    groups: [
      toolbarFeatureButtonsGroupWithItems([
        {
          ChildComponent: EmojiToolbarIcon,
          key: "insertEmoji",
          label: "Emoji",
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_EMOJI_PICKER_COMMAND, undefined);
          },
        },
      ]),
    ],
  },
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: EmojiToolbarIcon,
          key: "insertEmoji",
          keywords: ["emoji", "emoticon", "smile", "shortcode", "gemoji"],
          label: "Emoji",
          onSelect: ({ editor }) => {
            editor.dispatchCommand(OPEN_EMOJI_PICKER_COMMAND, undefined);
          },
        },
      ]),
    ],
  },
  plugins: [
    {
      Component: EmojiPickerPlugin,
      position: "normal",
    },
  ],
});
