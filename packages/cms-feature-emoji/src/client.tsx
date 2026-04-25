"use client";

import {
  createClientFeature,
  slashMenuBasicGroupWithItems,
  toolbarFormatGroupWithItems,
} from "@payloadcms/richtext-lexical/client";

import { OPEN_EMOJI_PICKER_COMMAND } from "./plugins/emojiPickerCommand";
import { EmojiPickerPlugin } from "./plugins/EmojiPickerPlugin";
import { EMOJI_SHORTCODE_TRANSFORMER } from "./transformers/emojiShortcode";

function EmojiToolbarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="currentColor"
      focusable="false"
      height="20"
      viewBox="0 0 256 256"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,48c-10.29,17.79-27.4,28-46.93,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.07-20a8,8,0,0,1,13.86,8Z" />
    </svg>
  );
}

export const EmojiFeatureClient = createClientFeature({
  markdownTransformers: [EMOJI_SHORTCODE_TRANSFORMER],
  toolbarFixed: {
    groups: [
      toolbarFormatGroupWithItems([
        {
          ChildComponent: EmojiToolbarIcon,
          key: "insertEmoji",
          label: "Emoji",
          order: 20,
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
          keywords: ["emoji", "emoticon", "smile", "shortcode"],
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
