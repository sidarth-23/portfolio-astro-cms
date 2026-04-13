import type { RichTextCssEngine } from "../types";
import type { BlockComponents } from "./types";
import { daisyuiComponents } from "./daisyui/index";

export function resolveBlockComponents(cssEngine?: RichTextCssEngine): BlockComponents {
  const engine: RichTextCssEngine = cssEngine ?? "daisyui";
  switch (engine) {
    case "daisyui":
      return daisyuiComponents;
    default: {
      const _exhaustive: never = engine;
      throw new Error(`Unknown CSS engine: ${_exhaustive}`);
    }
  }
}
