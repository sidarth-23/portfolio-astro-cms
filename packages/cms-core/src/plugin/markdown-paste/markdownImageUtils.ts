import { fromMarkdown } from "mdast-util-from-markdown";

type MarkdownPosition = {
  end?: {
    offset?: number;
  };
  start?: {
    offset?: number;
  };
};

type MarkdownNode = {
  alt?: unknown;
  children?: MarkdownNode[];
  position?: MarkdownPosition;
  type: string;
  url?: unknown;
};

export type MarkdownImageMatch = {
  alt: string;
  end: number;
  start: number;
  url: string;
};

export type UniqueMarkdownImage = {
  alt: string;
  url: string;
};

export const deriveAltFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() ?? "";
    const filenameWithoutExt = lastSegment.replace(/\.[a-z0-9]+$/i, "");
    const humanized = filenameWithoutExt.replace(/[-_]+/g, " ").trim();

    return humanized || "Imported image";
  } catch {
    return "Imported image";
  }
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const visitMarkdownNode = (node: MarkdownNode, callback: (node: MarkdownNode) => void): void => {
  callback(node);

  if (!Array.isArray(node.children)) {
    return;
  }

  for (const child of node.children) {
    visitMarkdownNode(child, callback);
  }
};

export const parseMarkdownImages = (markdown: string): MarkdownImageMatch[] => {
  if (!markdown.trim()) {
    return [];
  }

  const root = fromMarkdown(markdown) as MarkdownNode;
  const matches: MarkdownImageMatch[] = [];

  visitMarkdownNode(root, (node) => {
    if (node.type !== "image") {
      return;
    }

    if (!isHttpUrl(node.url)) {
      return;
    }

    const startOffset = node.position?.start?.offset;
    const endOffset = node.position?.end?.offset;

    if (!isFiniteNumber(startOffset) || !isFiniteNumber(endOffset) || endOffset <= startOffset) {
      return;
    }

    matches.push({
      alt: typeof node.alt === "string" ? node.alt.trim() : "",
      end: endOffset,
      start: startOffset,
      url: node.url,
    });
  });

  return matches.sort((a, b) => a.start - b.start);
};

export const getUniqueMarkdownImages = (matches: MarkdownImageMatch[]): UniqueMarkdownImage[] => {
  const uniqueByUrl = new Map<string, UniqueMarkdownImage>();

  for (const match of matches) {
    if (!uniqueByUrl.has(match.url)) {
      uniqueByUrl.set(match.url, {
        alt: match.alt,
        url: match.url,
      });
    }
  }

  return Array.from(uniqueByUrl.values());
};

export const replaceMarkdownRanges = (
  sourceMarkdown: string,
  replacements: Array<{ end: number; start: number; value: string }>,
): string => {
  if (replacements.length === 0) {
    return sourceMarkdown;
  }

  const sorted = [...replacements].sort((a, b) => a.start - b.start);

  let cursor = 0;
  let output = "";

  for (const replacement of sorted) {
    if (replacement.start < cursor) {
      continue;
    }

    output += sourceMarkdown.slice(cursor, replacement.start);
    output += replacement.value;
    cursor = replacement.end;
  }

  output += sourceMarkdown.slice(cursor);

  return output;
};
