/** @jsxImportSource preact */
import {
  convertLexicalToHTMLAsync,
  type HTMLConvertersFunctionAsync,
  LinkHTMLConverterAsync,
} from "@payloadcms/richtext-lexical/html-async";
import type { DefaultNodeTypes, SerializedBlockNode, SerializedUploadNode } from "@payloadcms/richtext-lexical";
import { renderToStaticMarkup } from "preact-render-to-string";

import { Callout } from "./blocks/Callout";
import { Code } from "./blocks/Code";
import { Upload } from "./blocks/Upload";
import { highlightCode } from "./blocks/shiki";
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

export const renderRichTextToHTML = async (
  { className, data, enableContainer = false }: RichTextRenderOptions,
  config?: RichTextRenderConfig,
): Promise<string> => {
  if (!data) return "";

  const internalDocToHref = createInternalDocHrefResolver(config?.internalDocHrefRouteMap);
  const profile = config?.calloutVariantProfile ?? "generic";
  const fallbackVariant = fallbackVariantByProfile[profile];

  const htmlConverters: HTMLConvertersFunctionAsync<NodeTypes> = ({ defaultConverters }) => ({
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
    ...LinkHTMLConverterAsync({ internalDocToHref }),
    ...createHeadingConverters(),
    blocks: {
      ...(defaultConverters.blocks ?? {}),
      callout: async ({ node }: { node: SerializedBlockNode<Record<string, unknown>> }) => {
        const fields = node.fields ?? {};
        const variant = (fields.variant as string) || fallbackVariant;
        const title = fields.title as string | undefined;
        const contentHtml = await renderRichTextToHTML(
          { data: fields.content as RichTextValue, enableContainer: false },
          config,
        );
        return renderToStaticMarkup(
          <Callout variant={variant} title={title} contentHtml={contentHtml} wrapperClass="my-6" />,
        );
      },
      Code: async ({ node }: { node: SerializedBlockNode<Record<string, unknown>> }) => {
        const fields = node.fields ?? {};
        const language = (fields.language as string) || "plaintext";
        const code = (fields.code as string) || "";
        const highlightedHtml = await highlightCode(code, language).catch(
          () => `<pre><code>${code}</code></pre>`,
        );
        return renderToStaticMarkup(
          <Code language={language} highlightedHtml={highlightedHtml} />,
        );
      },
    },
  });

  return convertLexicalToHTMLAsync({
    className,
    converters: htmlConverters,
    data,
    disableContainer: !enableContainer,
  });
};
