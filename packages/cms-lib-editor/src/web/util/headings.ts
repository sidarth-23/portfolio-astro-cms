import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { HTMLConvertersAsync } from "@payloadcms/richtext-lexical/html-async";
import type { RichTextValue, TableOfContentsItem } from "@/web/html/types";

import { slugify } from "@/web/util/slugify";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type SerializedNode = {
  children?: SerializedNode[];
  tag?: HeadingTag;
  text?: string;
  type?: string;
};

type SerializedRoot = {
  children?: SerializedNode[];
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

export const createHeadingConverters = (): HTMLConvertersAsync<DefaultNodeTypes> => {
  const nextHeadingId = createHeadingIdFactory();

  return {
    heading: async ({ node, nodesToHTML, providedStyleTag }) => {
      const children = (await nodesToHTML({ nodes: node.children })).join("");
      const text = extractPlainText(node as SerializedNode)
        .replace(/\s+/g, " ")
        .trim();
      const idAttribute = text ? ` id="${nextHeadingId(text)}"` : "";

      return `<${node.tag}${idAttribute}${providedStyleTag} class="scroll-mt-24 first:mt-6">${children}</${node.tag}>`;
    },
  };
};

export const extractTableOfContents = (
  data: RichTextValue | null | undefined,
): TableOfContentsItem[] => {
  const root = (data as { root?: SerializedRoot } | null | undefined)?.root;
  if (!root?.children?.length) {
    return [];
  }

  const nextHeadingId = createHeadingIdFactory();
  const toc: TableOfContentsItem[] = [];

  root.children.forEach((node) => {
    if (node.type !== "heading") {
      return;
    }

    if (node.tag !== "h2" && node.tag !== "h3") {
      return;
    }

    const text = extractPlainText(node).replace(/\s+/g, " ").trim();
    if (!text) {
      return;
    }

    toc.push({
      depth: node.tag === "h2" ? 2 : 3,
      id: nextHeadingId(text),
      text,
    });
  });

  return toc;
};
