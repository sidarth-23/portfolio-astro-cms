import {
  LinkJSXConverter,
  RichText as PayloadRichText,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import type { DefaultNodeTypes, SerializedLinkNode } from "@payloadcms/richtext-lexical";
import type { SerializedEditorState } from "lexical";
import React from "react";

export type RichTextValue = SerializedEditorState;

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

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
});

type RichTextRendererProps = {
  className?: string;
  data?: SerializedEditorState | null;
  enableContainer?: boolean;
};

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  className,
  data,
  enableContainer = false,
}) => {
  if (!data) {
    return null;
  }

  return (
    <PayloadRichText
      className={className}
      converters={jsxConverters}
      data={data}
      disableContainer={!enableContainer}
    />
  );
};
