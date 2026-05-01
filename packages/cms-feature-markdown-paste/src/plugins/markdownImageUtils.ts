import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Root } from "mdast";

type MarkdownNode = {
  alt?: unknown;
  children?: MarkdownNode[];
  position?: {
    end?: { offset?: number };
    start?: { offset?: number };
  };
  type: string;
  url?: unknown;
};

export type MarkdownImageMatch = {
  alt: string;
  url: string;
};

export type UniqueMarkdownImage = {
  alt: string;
  url: string;
};

type ParentAwareVisitor = (args: {
  index: number;
  node: MarkdownNode;
  parent: MarkdownNode;
}) => void;

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

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const visitMarkdownNodeWithParent = (node: MarkdownNode, callback: ParentAwareVisitor): void => {
  const traverse = (current: MarkdownNode, parent?: MarkdownNode, index?: number): void => {
    if (parent && typeof index === "number") {
      callback({ index, node: current, parent });
    }

    if (!Array.isArray(current.children)) {
      return;
    }

    for (const [childIndex, child] of current.children.entries()) {
      traverse(child, current, childIndex);
    }
  };

  traverse(node);
};

const isStandaloneHttpImageNode = ({
  node,
  parent,
}: {
  node: MarkdownNode;
  parent?: MarkdownNode;
}) => {
  return node.type === "image" && isHttpUrl(node.url) && parent?.type !== "link";
};

const parseMarkdown = (markdown: string): Root => {
  return fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
};

export const parseMarkdownImages = (markdown: string): MarkdownImageMatch[] => {
  if (!markdown.trim()) {
    return [];
  }

  const root = parseMarkdown(markdown);
  const matches: MarkdownImageMatch[] = [];

  visitMarkdownNodeWithParent(root as unknown as MarkdownNode, ({ node, parent }) => {
    if (!isStandaloneHttpImageNode({ node, parent })) {
      return;
    }

    matches.push({
      alt: typeof node.alt === "string" ? node.alt.trim() : "",
      url: node.url as string,
    });
  });

  return matches;
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

export const replaceMarkdownImageUrlsWithMediaReferences = ({
  markdown,
  mediaIdByUrl,
}: {
  markdown: string;
  mediaIdByUrl: Map<string, string>;
}): { markdown: string; replacedCount: number } => {
  if (!markdown.trim() || mediaIdByUrl.size === 0) {
    return { markdown, replacedCount: 0 };
  }

  const root = parseMarkdown(markdown);
  const replacements: Array<{ end: number; next: string; start: number }> = [];

  visitMarkdownNodeWithParent(root as unknown as MarkdownNode, ({ node, parent }) => {
    if (!isStandaloneHttpImageNode({ node, parent })) {
      return;
    }

    const positionStart = node.position?.start?.offset;
    const positionEnd = node.position?.end?.offset;

    if (typeof positionStart !== "number" || typeof positionEnd !== "number") {
      return;
    }

    const mediaId = mediaIdByUrl.get(node.url as string);
    if (!mediaId) {
      return;
    }

    replacements.push({
      end: positionEnd,
      next: `![media:${mediaId}]()`,
      start: positionStart,
    });
  });

  if (replacements.length === 0) {
    return { markdown, replacedCount: 0 };
  }

  const patchedMarkdown = replacements
    .sort((left, right) => right.start - left.start)
    .reduce((current, replacement) => {
      return (
        current.slice(0, replacement.start) + replacement.next + current.slice(replacement.end)
      );
    }, markdown);

  return {
    markdown: patchedMarkdown,
    replacedCount: replacements.length,
  };
};
