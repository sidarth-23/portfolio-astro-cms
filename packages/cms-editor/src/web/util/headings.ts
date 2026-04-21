import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { HTMLConvertersAsync } from "@payloadcms/richtext-lexical/html-async";

import { slugify } from "@/web/util/slugify";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type SerializedNode = {
  children?: SerializedNode[];
  tag?: HeadingTag;
  text?: string;
  type?: string;
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

      return `<${node.tag}${idAttribute}${providedStyleTag} class="scroll-mt-24">${children}</${node.tag}>`;
    },
  };
};
