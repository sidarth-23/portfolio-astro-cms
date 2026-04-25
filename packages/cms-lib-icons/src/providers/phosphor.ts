import { icons } from "@phosphor-icons/core";
import type { IconOption, IconProvider } from "../types";
import { PHOSPHOR_SVG_MAP } from "../generated/phosphorSvgMap";

// ---- Constants ----

const VIEWBOX = "0 0 256 256";
const SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="currentColor">`;
const SVG_CLOSE = `</svg>`;

// ---- Data ----

const ICON_NAMES = new Set<string>(icons.map((icon) => icon.name));

const ALL_OPTIONS: IconOption[] = icons
  .map((icon) => ({
    label: icon.name,
    key: icon.name,
    searchText: (icon.name + " " + icon.tags.join(" ")).toLowerCase(),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// ---- Provider ----

export const phosphorProvider: IconProvider = {
  prefix: "ph",
  source: "phosphor",
  displayName: "Phosphor",
  previewImageStyle: { filter: "brightness(0) invert(1)" },

  options: ALL_OPTIONS,

  isValidKey: (key) => ICON_NAMES.has(key),

  getCdnPreviewUrl: (key) => {
    return `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2/assets/regular/${key}.svg`;
  },

  resolve: (key) => {
    const innerSvg = PHOSPHOR_SVG_MAP[key];
    if (!innerSvg) return null;
    return {
      label: key,
      viewBox: VIEWBOX,
      innerSvg,
      svg: `${SVG_OPEN}${innerSvg}${SVG_CLOSE}`,
    };
  },
};
