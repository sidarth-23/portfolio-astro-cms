/** @jsxImportSource preact */
import {
  convertLexicalToHTML,
  type HTMLConvertersFunction,
  LinkHTMLConverter,
} from "@payloadcms/richtext-lexical/html";
import type { DefaultNodeTypes, SerializedBlockNode, SerializedUploadNode } from "@payloadcms/richtext-lexical";
import { renderToStaticMarkup } from "preact-render-to-string";

import { Callout } from "./blocks/Callout";
import { Upload } from "./blocks/Upload";
import { createHeadingConverters } from "./headings";
import { createInternalDocHrefResolver, type InternalDocHrefRouteMap } from "./linkResolver";
import type {
  CalloutVariantProfile,
  RichTextCssEngine,
  RichTextRenderOptions,
  RichTextValue,
} from "./types";

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<Record<string, unknown>>;

export type RichTextRenderConfig = {
  internalDocHrefRouteMap?: InternalDocHrefRouteMap;
  cssEngine?: RichTextCssEngine;
  calloutVariantProfile?: CalloutVariantProfile;
  mediaBaseUrl?: string;
};

const fallbackVariantByProfile: Record<CalloutVariantProfile, string> = {
  generic: "neutral",
  blog: "note",
};

export const renderRichTextToHTML = (
  { className, data, enableContainer = false }: RichTextRenderOptions,
  config?: RichTextRenderConfig,
): string => {
  if (!data) return "";

  const internalDocToHref = createInternalDocHrefResolver(config?.internalDocHrefRouteMap);
  const profile = config?.calloutVariantProfile ?? "generic";
  const fallbackVariant = fallbackVariantByProfile[profile];

  const htmlConverters: HTMLConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...(config?.mediaBaseUrl
      ? {
          upload: ({ node }: { node: SerializedUploadNode }) => {
            if (typeof node.value !== "object" || !node.value) return "";
            const alt = (node as any).fields?.alt ?? (node.value as any).alt ?? "";
            return renderToStaticMarkup(
              <Upload doc={node.value as any} alt={alt} mediaBaseUrl={config.mediaBaseUrl} />,
            );
          },
        }
      : {}),
    ...LinkHTMLConverter({ internalDocToHref }),
    ...createHeadingConverters(),
    blocks: {
      ...(defaultConverters.blocks ?? {}),
      callout: ({ node }: { node: SerializedBlockNode<Record<string, unknown>> }) => {
        const fields = node.fields ?? {};
        const variant = (fields.variant as string) || fallbackVariant;
        const title = fields.title as string | undefined;
        const contentHtml = renderRichTextToHTML(
          { data: fields.content as RichTextValue, enableContainer: false },
          config,
        );
        return renderToStaticMarkup(
          <Callout variant={variant} title={title} contentHtml={contentHtml} wrapperClass="my-6" />,
        );
      },
    },
  });

  return convertLexicalToHTML({
    className,
    converters: htmlConverters,
    data,
    disableContainer: !enableContainer,
  });
};
