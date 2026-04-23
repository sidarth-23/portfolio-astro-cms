// Lightweight entry point for the "./parser" export path.
// Consumers that only need parsing (no catalog, no SVG resolution) import from here.
export { parseIconValue, isValidIconValue } from "./registry";
export type { ParsedIconValue } from "./registry";
