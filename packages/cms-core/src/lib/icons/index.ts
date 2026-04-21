export { parseIconValueStrict } from "./parser";

export {
  PHOSPHOR_ICON_OPTIONS,
  findPhosphorIconOptions,
  getPhosphorIconSvgUrl,
  isPhosphorIconName,
} from "./phosphorIconsCatalog";

export {
  SIMPLE_ICON_OPTIONS,
  findSimpleIconOptions,
  getSimpleIconCdnUrl,
  isSimpleIconSlug,
} from "./simpleIconsCatalog";

export type { ParsedIconValue } from "./parser";
export type { PhosphorIconOption } from "./phosphorIconsCatalog";
export type { SimpleIconOption } from "./simpleIconsCatalog";
