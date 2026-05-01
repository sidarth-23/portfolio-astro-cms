import type { EmojiMartData } from "@emoji-mart/data";
import data from "@emoji-mart/data";

const d = data as EmojiMartData;

const shortcodeToEmoji: Record<string, string> = {};

for (const [id, emoji] of Object.entries(d.emojis)) {
  const native = emoji.skins[0]?.native;
  if (native) shortcodeToEmoji[id] = native;
}

for (const [alias, id] of Object.entries(d.aliases)) {
  const native = shortcodeToEmoji[id];
  if (native) shortcodeToEmoji[alias] = native;
}

export { shortcodeToEmoji };
