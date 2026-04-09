import {
  convertLexicalToHTML,
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

type NodeTypes = DefaultNodeTypes;

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

const htmlConverters: HTMLConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkHTMLConverter({ internalDocToHref }),
});

export const renderRichTextToHTML = ({
  className,
  data,
  enableContainer = false,
}: RichTextRenderOptions): string => {
  if (!data) {
    return "";
  }

  return convertLexicalToHTML({
    className,
    converters: htmlConverters,
    data,
    disableContainer: !enableContainer,
  });
};
