/** @jsxImportSource preact */
import {
  convertLexicalToHTMLAsync,
  type HTMLConvertersFunctionAsync,
  LinkHTMLConverterAsync,
} from "@payloadcms/richtext-lexical/html-async";
import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedUploadNode,
} from "@payloadcms/richtext-lexical";
import { renderToStaticMarkup } from "preact-render-to-string";

import { highlightCode } from "@/web/util/shiki";
import type { UploadDoc } from "@/web/util/image";
import { createHeadingConverters } from "./headings";
import { createInternalDocHrefResolver, type InternalDocHrefRouteMap } from "./linkResolver";
import { ContentSection } from "./ContentSection";
import type {
  BlockComponents,
  CalloutVariantProfile,
  RichTextRenderOptions,
  RichTextValue,
} from "./types";

type PopulatedUploadValue = {
  alt?: string | null;
  caption?: RichTextValue | null;
  url?: string | null;
  [key: string]: unknown;
};

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<Record<string, unknown>>;

export type RichTextRenderConfig = {
  internalDocHrefRouteMap?: InternalDocHrefRouteMap;
  calloutVariantProfile?: CalloutVariantProfile;
  mediaBaseUrl?: string;
};

const fallbackVariantByProfile: Record<CalloutVariantProfile, string> = {
  generic: "neutral",
  blog: "note",
};

export function createRichTextRenderer(components: BlockComponents) {
  const { Callout, Code, Upload, ImageGallery } = components;

  const renderRichTextToHTML = async (
    { className, data, enableContainer = false }: RichTextRenderOptions,
    config?: RichTextRenderConfig,
  ): Promise<string> => {
    if (!data) return "";

    const internalDocToHref = createInternalDocHrefResolver(config?.internalDocHrefRouteMap);
    const profile = config?.calloutVariantProfile ?? "generic";
    const fallbackVariant = fallbackVariantByProfile[profile];

    const htmlConverters: HTMLConvertersFunctionAsync<NodeTypes> = ({ defaultConverters }) => ({
      ...defaultConverters,
      upload: async ({ node }: { node: SerializedUploadNode }) => {
        if (typeof node.value !== "object" || !node.value) return "";
        const alt =
          ((node.fields as Record<string, unknown> | undefined)?.alt as string | undefined) ??
          (node.value as PopulatedUploadValue).alt ??
          "";
        const mediaCaption = (node.value as PopulatedUploadValue).caption;
        const captionHtml = mediaCaption
          ? await renderRichTextToHTML({ data: mediaCaption, enableContainer: false }, config)
          : null;
        return renderToStaticMarkup(
          <Upload
            doc={node.value as UploadDoc}
            alt={alt}
            captionHtml={captionHtml}
            mediaBaseUrl={config?.mediaBaseUrl}
          />,
        );
      },
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
            <Callout
              variant={variant}
              title={title}
              contentHtml={contentHtml}
              wrapperClass="my-6"
            />,
          );
        },
        imageGallery: async ({ node }: { node: SerializedBlockNode<Record<string, unknown>> }) => {
          const fields = node.fields ?? {};
          const caption = (fields.caption as string | null | undefined) ?? null;
          const rawImages =
            (fields.images as
              | Array<{ image: UploadDoc | string | number | null }>
              | null
              | undefined) ?? [];

          const images = await Promise.all(
            rawImages
              .filter(
                (entry): entry is { image: PopulatedUploadValue & UploadDoc } =>
                  entry.image !== null &&
                  typeof entry.image === "object" &&
                  typeof (entry.image as UploadDoc).url === "string",
              )
              .map(async (entry) => {
                const doc = entry.image;
                const alt = (doc.alt as string) ?? "";
                const mediaCaption = doc.caption;
                const captionHtml = mediaCaption
                  ? await renderRichTextToHTML(
                      { data: mediaCaption, enableContainer: false },
                      config,
                    )
                  : null;
                return { doc, alt, captionHtml };
              }),
          );

          if (images.length === 0) return "";

          return renderToStaticMarkup(
            <ImageGallery images={images} caption={caption} mediaBaseUrl={config?.mediaBaseUrl} />,
          );
        },
        Code: async ({ node }: { node: SerializedBlockNode<Record<string, unknown>> }) => {
          const fields = node.fields ?? {};
          const mode = (fields.mode as string) || "single";
          const caption = (fields.caption as string | null | undefined) ?? null;

          if (mode === "multiple") {
            type Entry = { name: string; language: string; code: string };
            const rawEntries = (fields.entries as Entry[] | null | undefined) ?? [];
            const entries = await Promise.all(
              rawEntries.map(async (entry) => {
                const lang = entry.language || "plaintext";
                const highlightedHtml = await highlightCode(entry.code || "", lang).catch(
                  () => `<pre><code>${entry.code}</code></pre>`,
                );
                return { name: entry.name || "", language: lang, highlightedHtml };
              }),
            );
            return renderToStaticMarkup(
              <Code mode="multiple" entries={entries} caption={caption} />,
            );
          }

          // Single mode
          const language = (fields.language as string) || "plaintext";
          const code = (fields.code as string) || "";
          const highlightedHtml = await highlightCode(code, language).catch(
            () => `<pre><code>${code}</code></pre>`,
          );
          return renderToStaticMarkup(
            <Code
              mode="single"
              language={language}
              highlightedHtml={highlightedHtml}
              caption={caption}
            />,
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

  const renderBlock = async (
    block: Record<string, unknown>,
    config?: RichTextRenderConfig,
  ): Promise<string> => {
    switch (block.blockType) {
      case "contentSection": {
        const contentHtml = await renderRichTextToHTML(
          { data: block.content as RichTextValue, enableContainer: false },
          config,
        );
        return renderToStaticMarkup(
          <ContentSection title={block.title as string | null} contentHtml={contentHtml} />,
        );
      }

      case "callout": {
        const profile = config?.calloutVariantProfile ?? "generic";
        const fallbackVariant = fallbackVariantByProfile[profile];
        const contentHtml = await renderRichTextToHTML(
          { data: block.content as RichTextValue, enableContainer: false },
          config,
        );
        return renderToStaticMarkup(
          <Callout
            variant={(block.variant as string) || fallbackVariant}
            title={block.title as string | null}
            contentHtml={contentHtml}
          />,
        );
      }

      case "code": {
        const mode = (block.mode as string) || "single";
        const caption = (block.caption as string | null | undefined) ?? null;

        if (mode === "multiple") {
          type Entry = { name: string; language: string; code: string };
          const rawEntries = (block.entries as Entry[] | null | undefined) ?? [];
          const entries = await Promise.all(
            rawEntries.map(async (entry) => {
              const lang = entry.language || "plaintext";
              const highlightedHtml = await highlightCode(entry.code || "", lang).catch(
                () => `<pre><code>${entry.code}</code></pre>`,
              );
              return { name: entry.name || "", language: lang, highlightedHtml };
            }),
          );
          return renderToStaticMarkup(<Code mode="multiple" entries={entries} caption={caption} />);
        }

        const language = (block.language as string) || "plaintext";
        const code = (block.code as string) || "";
        const highlightedHtml = await highlightCode(code, language).catch(
          () => `<pre><code>${code}</code></pre>`,
        );
        return renderToStaticMarkup(
          <Code
            mode="single"
            language={language}
            highlightedHtml={highlightedHtml}
            caption={caption}
          />,
        );
      }

      case "imageGallery": {
        const caption = (block.caption as string | null | undefined) ?? null;
        const rawImages =
          (block.images as
            | Array<{ image: UploadDoc | string | number | null }>
            | null
            | undefined) ?? [];

        const images = await Promise.all(
          rawImages
            .filter(
              (entry): entry is { image: PopulatedUploadValue & UploadDoc } =>
                entry.image !== null &&
                typeof entry.image === "object" &&
                typeof (entry.image as UploadDoc).url === "string",
            )
            .map(async (entry) => {
              const doc = entry.image;
              const alt = (doc.alt as string) ?? "";
              const mediaCaption = doc.caption;
              const captionHtml = mediaCaption
                ? await renderRichTextToHTML({ data: mediaCaption, enableContainer: false }, config)
                : null;
              return { doc, alt, captionHtml };
            }),
        );

        if (images.length === 0) return "";

        return renderToStaticMarkup(
          <ImageGallery images={images} caption={caption} mediaBaseUrl={config?.mediaBaseUrl} />,
        );
      }

      default:
        return "";
    }
  };

  const renderBlocks = async (
    blocks: unknown[],
    config?: RichTextRenderConfig,
  ): Promise<string> => {
    const results = await Promise.all(
      (blocks as Record<string, unknown>[]).map((block) => renderBlock(block, config)),
    );
    return results.join("");
  };

  return { renderRichTextToHTML, renderBlock, renderBlocks };
}
