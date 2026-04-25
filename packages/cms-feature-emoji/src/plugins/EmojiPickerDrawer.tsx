"use client";

import { useMemo, useState, type ReactElement } from "react";
import type { LexicalEditor } from "lexical";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  Button,
  Drawer,
  DrawerContentContainer,
  FieldDescription,
  FieldLabel,
  ReactSelect,
  fieldBaseClass,
  type ReactSelectOption as Option,
  useModal,
} from "@payloadcms/ui";
import { gemoji } from "gemoji";

type EmojiOption = Option & {
  description: string;
  emoji: string;
  shortcode: string;
};

type EmojiPickerDrawerProps = {
  drawerSlug: string;
  editor: LexicalEditor;
};

const RESULTS_LIMIT = 75;

const toEmojiOption = (entry: (typeof gemoji)[number]): EmojiOption => {
  const shortcode = entry.names[0] ?? "";

  return {
    description: entry.description,
    emoji: entry.emoji,
    label: `${entry.emoji} :${shortcode}:`,
    shortcode,
    value: shortcode,
  };
};

const DEFAULT_OPTIONS: EmojiOption[] = gemoji.slice(0, RESULTS_LIMIT).map(toEmojiOption);

const matchesEmoji = (entry: (typeof gemoji)[number], query: string): boolean => {
  if (!query) {
    return true;
  }

  const lowerQuery = query.toLowerCase();

  if (entry.names.some((name) => name.includes(lowerQuery))) {
    return true;
  }

  if (entry.tags.some((tag) => tag.includes(lowerQuery))) {
    return true;
  }

  if (entry.description.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  return entry.category.toLowerCase().includes(lowerQuery);
};

export function EmojiPickerDrawer({ drawerSlug, editor }: EmojiPickerDrawerProps): ReactElement {
  const { closeModal } = useModal();
  const [searchQuery, setSearchQuery] = useState("");

  const options = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return DEFAULT_OPTIONS;
    }

    return gemoji
      .filter((entry) => matchesEmoji(entry, normalizedQuery))
      .slice(0, RESULTS_LIMIT)
      .map(toEmojiOption);
  }, [searchQuery]);

  const insertEmoji = (emoji: string) => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        selection.insertNodes([$createTextNode(emoji)]);
        return;
      }

      $getRoot().append($createParagraphNode().append($createTextNode(emoji)));
    });

    closeModal(drawerSlug);
    setSearchQuery("");
  };

  return (
    <Drawer slug={drawerSlug} title="Insert Emoji">
      <DrawerContentContainer>
        <div className={fieldBaseClass}>
          <FieldLabel label="Search Emoji" path={`${drawerSlug}.emoji`} />
          <ReactSelect
            components={{
              Option: ({ children, ...props }) => {
                return (
                  <div {...props.innerProps} ref={props.innerRef} className={props.className}>
                    <span style={{ alignItems: "center", display: "inline-flex", gap: "8px" }}>
                      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{props.data.emoji}</span>
                      <span>{children}</span>
                    </span>
                  </div>
                );
              },
            }}
            isSearchable
            name={`${drawerSlug}.emoji`}
            options={options}
            path={`${drawerSlug}.emoji`}
            placeholder="Search by name, tag, or description"
            value={undefined}
            onChange={(selectedOption) => {
              if (!selectedOption || Array.isArray(selectedOption)) {
                return;
              }

              insertEmoji(selectedOption.emoji);
            }}
            onInputChange={(value) => {
              setSearchQuery(value);
            }}
          />
          <FieldDescription
            description="Supports GitHub shortcodes as search terms, such as grinning, tada, or heart."
            path={`${drawerSlug}.emoji`}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              closeModal(drawerSlug);
              setSearchQuery("");
            }}
            type="button"
          >
            Close
          </Button>
        </div>
      </DrawerContentContainer>
    </Drawer>
  );
}
