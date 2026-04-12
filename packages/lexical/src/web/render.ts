import {
  convertLexicalToHTML,
  type HTMLConvertersFunction,
  LinkHTMLConverter,
} from "@payloadcms/richtext-lexical/html";
import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";

import { createHeadingConverters } from "./headings";
import { createInternalDocHrefResolver, type InternalDocHrefRouteMap } from "./linkResolver";
import type { RichTextRenderOptions } from "./types";

type NodeTypes = DefaultNodeTypes;

export type RichTextRenderConfig = {
  internalDocHrefRouteMap?: InternalDocHrefRouteMap;
};

export const renderRichTextToHTML = (
  {
    className,
    data,
    enableContainer = false,
  }: RichTextRenderOptions,
  config?: RichTextRenderConfig,
): string => {
  if (!data) {
    return "";
  }

  const internalDocToHref = createInternalDocHrefResolver(config?.internalDocHrefRouteMap);
  const htmlConverters: HTMLConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkHTMLConverter({ internalDocToHref }),
    ...createHeadingConverters(),
  });

  return convertLexicalToHTML({
    className,
    converters: htmlConverters,
    data,
    disableContainer: !enableContainer,
  });
};
