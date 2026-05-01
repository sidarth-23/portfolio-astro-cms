/**
 * Decodes the HTML entities that the footnotes preprocessing rule encodes into
 * fenced-token attributes (& and ").
 */
export const decodeHtmlEntities = (s: string): string =>
  s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
