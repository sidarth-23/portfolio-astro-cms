import {
  convertLexicalToHTML,
  type HTMLConverters,
  LinkHTMLConverter,
  type HTMLConvertersFunction,
} from "@payloadcms/richtext-lexical/html";
import type { DefaultNodeTypes, SerializedLinkNode } from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "lexical";

export type RichTextValue = SerializedEditorState;

export type RichTextRenderOptions = {
  className?: string;
  data?: RichTextValue | null;
  enableContainer?: boolean;
};

export type TableOfContentsItem = {
  depth: 2 | 3;
  id: string;
  text: string;
};

type NodeTypes = DefaultNodeTypes;
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

const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/^-+|-+$/g, "");
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

const collectHeadings = (data?: RichTextValue | null): HeadingDescriptor[] => {
  const root = data?.root as SerializedNode | undefined;

  if (!root || !Array.isArray(root.children)) {
    return [];
  }

  const slugCounts = new Map<string, number>();
  const headings: HeadingDescriptor[] = [];

  const visit = (node: SerializedNode) => {
    if (node.type === "heading" && node.tag) {
      const text = extractPlainText(node).replace(/\s+/g, " ").trim();

      if (text) {
        const baseId = createSlug(text) || "section";
        const nextCount = (slugCounts.get(baseId) ?? 0) + 1;
        const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;

        slugCounts.set(baseId, nextCount);
        headings.push({ id, tag: node.tag, text });
      }
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visit);
    }
  };

  root.children.forEach(visit);

  return headings;
};

const createHeadingConverters = (headings: HeadingDescriptor[]): HTMLConverters<NodeTypes> => {
  const headingIds = headings.map((heading) => heading.id);

  return {
    heading: ({ node, nodesToHTML, providedStyleTag }) => {
      const children = nodesToHTML({
        nodes: node.children,
      }).join("");
      const id = headingIds.shift();
      const idAttribute = id ? ` id="${id}"` : "";

      return `<${node.tag}${idAttribute}${providedStyleTag} class="scroll-mt-24">${children}</${node.tag}>`;
    },
  };
};

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }): string => {
  const docValue = linkNode?.fields?.doc?.value;
  const relationTo = linkNode?.fields?.doc?.relationTo;

  if (!docValue || typeof docValue !== "object" || !("slug" in docValue)) {
    return "#";
  }

  const slug = String(docValue.slug || "");

  if (relationTo === "posts") {
    return `/blog/${slug}`;
  }

  if (relationTo === "projects") {
    return `/projects#${slug}`;
  }

  return slug ? `/${slug}` : "#";
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

export const renderRichTextToHTML = ({
  className,
  data,
  enableContainer = false,
}: RichTextRenderOptions): string => {
  if (!data) {
    return "";
  }

  const headings = collectHeadings(data);
  const htmlConverters: HTMLConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkHTMLConverter({ internalDocToHref }),
    ...createHeadingConverters(headings),
  });

  return convertLexicalToHTML({
    className,
    converters: htmlConverters,
    data,
    disableContainer: !enableContainer,
  });
};
