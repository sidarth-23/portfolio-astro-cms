import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { HTMLConvertersAsync } from "@payloadcms/richtext-lexical/html-async";

import { slugify } from "./slugify";
import type { RichTextValue, TableOfContentsItem } from "./types";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type SerializedNode = {
  children?: SerializedNode[];
  tag?: HeadingTag;
  text?: string;
  type?: string;
};

type HeadingDescriptor = {
  id: string;
  tag: HeadingTag;
  text: string;
};

const extractPlainText = (node: SerializedNode): string => {
  const parts: string[] = [];

  if (typeof node.text === "string") {
    parts.push(node.text);
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => {
      const childText = extractPlainText(child);

      if (childText) {
        parts.push(childText);
      }
    });
  }

  return parts.join("");
};

const createHeadingIdFactory = () => {
  const slugCounts = new Map<string, number>();

  return (text: string): string => {
    const baseId = slugify(text) || "section";
    const nextCount = (slugCounts.get(baseId) ?? 0) + 1;

    slugCounts.set(baseId, nextCount);

    return nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
  };
};

const collectHeadings = (data?: RichTextValue | null): HeadingDescriptor[] => {
  const root = data?.root as SerializedNode | undefined;

  if (!root || !Array.isArray(root.children)) {
    return [];
  }

  const nextHeadingId = createHeadingIdFactory();
  const headings: HeadingDescriptor[] = [];

  const visit = (node: SerializedNode) => {
    if (node.type === "heading" && node.tag) {
      const text = extractPlainText(node).replace(/\s+/g, " ").trim();

      if (text) {
        headings.push({
          id: nextHeadingId(text),
          tag: node.tag,
          text,
        });
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visit);
    }
  };

  root.children.forEach(visit);

  return headings;
};

export const createHeadingConverters = (): HTMLConvertersAsync<DefaultNodeTypes> => {
  const nextHeadingId = createHeadingIdFactory();

  return {
    heading: async ({ node, nodesToHTML, providedStyleTag }) => {
      const children = (await nodesToHTML({ nodes: node.children })).join("");
      const text = extractPlainText(node as SerializedNode).replace(/\s+/g, " ").trim();
      const idAttribute = text ? ` id="${nextHeadingId(text)}"` : "";

      return `<${node.tag}${idAttribute}${providedStyleTag} class="scroll-mt-24">${children}</${node.tag}>`;
    },
  };
};

export const extractTableOfContents = (data?: RichTextValue | null): TableOfContentsItem[] => {
  return collectHeadings(data)
    .filter((heading): heading is HeadingDescriptor & { tag: "h2" | "h3" } => {
      return heading.tag === "h2" || heading.tag === "h3";
    })
    .map((heading) => ({
      depth: heading.tag === "h2" ? 2 : 3,
      id: heading.id,
      text: heading.text,
    }));
};
