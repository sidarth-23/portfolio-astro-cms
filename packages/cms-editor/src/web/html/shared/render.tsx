/** @jsxImportSource preact */
import {
  TextHTMLConverterAsync,
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
import { createHeadingConverters } from "../../util/headings";
import {
  createInternalDocHrefResolver,
  type InternalDocHrefRouteMap,
} from "../../util/linkResolver";
import type {
  BlockComponents,
  CalloutVariantProfile,
  RichTextRenderOptions,
  RichTextValue,
} from "../types";

// ---------------------------------------------------------------------------
// Footnote node shapes (serialized from Lexical)
// ---------------------------------------------------------------------------

type SerializedFootnoteReferenceNode = {
  type: "footnote-reference";
  footnoteId: string;
  version: number;
};

type SerializedFootnoteDefinitionNode = {
  type: "footnote-definition";
  footnoteId: string;
  children: RichTextValue["root"]["children"]; // same element type as Lexical's SerializedLexicalNode[]
  format: number;
  indent: number;
  direction: "ltr" | "rtl" | null;
  version: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const collectFootnoteDefinitions = (data: RichTextValue): SerializedFootnoteDefinitionNode[] => {
  // Only top-level root children are scanned: FootnoteDefinitionNode.isInline() is false
  // and it extends ElementNode, so it can only appear at the document root level.
  if (!Array.isArray(data?.root?.children)) return [];
  return data.root.children.filter(
    (n): n is SerializedFootnoteDefinitionNode =>
      typeof n === "object" &&
      n !== null &&
      (n as { type?: string }).type === "footnote-definition",
  );
};

type Props = {
  title?: string | null;
  contentHtml: string;
};

function ContentSection({ title, contentHtml }: Props) {
  return (
    <section>
      {title && <h2 class="text-3xl w-full font-bold mb-4">{title}</h2>}
      <div class="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </section>
  );
}

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

// ---------------------------------------------------------------------------
// Definition-list helper
// ---------------------------------------------------------------------------

type RenderRichTextToHTML = (
  opts: RichTextRenderOptions,
  config?: RichTextRenderConfig,
) => Promise<string>;

type SerializedElementLike = {
  children: RichTextValue["root"]["children"];
  direction: "ltr" | "rtl" | null;
};

async function renderElementTag(
  node: unknown,
  tag: string,
  renderRichTextToHTML: RenderRichTextToHTML,
  config: RichTextRenderConfig | undefined,
): Promise<string> {
  const typedNode = node as unknown as SerializedElementLike;
  const childrenHtml = await renderRichTextToHTML(
    {
      data: {
        root: {
          type: "root",
          children: typedNode.children,
          format: "",
          indent: 0,
          version: 1,
          direction: typedNode.direction,
        },
      },
      enableContainer: false,
    },
    config,
  );
  return `<${tag}>${childrenHtml}</${tag}>`;
}

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

    const htmlConverters: HTMLConvertersFunctionAsync<NodeTypes> = ({ defaultConverters }) => {
      return {
        ...defaultConverters,
        // Payload's default text converter handles bold/italic/strikethrough/underline/code/sub/sup
        // but skips IS_HIGHLIGHT (bit 128). Wrap with <mark> when that bit is set.
        text: (args) => {
          const conv = defaultConverters.text ?? TextHTMLConverterAsync.text;
          const html = (typeof conv === "function" ? conv(args) : (conv ?? "")) as string;
          const format = (args.node as { format?: number }).format ?? 0;
          return format & 128 ? `<mark>${html}</mark>` : html;
        },
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
        "footnote-reference": ({ node }) => {
          const fn = node as unknown as SerializedFootnoteReferenceNode;
          const id = escapeHtml(fn.footnoteId);
          const encodedId = encodeURIComponent(fn.footnoteId);
          // NOTE: Multiple references to the same footnote ID will produce duplicate HTML id attributes.
          // Supporting multiple backrefs (fnref-1, fnref-1-2, ...) requires stateful rendering
          // and is deferred to a future enhancement.
          return `<sup class="footnote-ref"><a href="#fn-${encodedId}" id="fnref-${encodedId}">${id}</a></sup>`;
        },
        // Definitions are rendered as a footnotes section after the main HTML (see post-processing below);
        // suppress inline output to avoid duplicating content.
        "footnote-definition": () => "",
        "definition-list": async ({ node }) =>
          renderElementTag(node, "dl", renderRichTextToHTML, config),
        "definition-term": async ({ node }) =>
          renderElementTag(node, "dt", renderRichTextToHTML, config),
        "definition-description": async ({ node }) =>
          renderElementTag(node, "dd", renderRichTextToHTML, config),
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
          imageGallery: async ({
            node,
          }: {
            node: SerializedBlockNode<Record<string, unknown>>;
          }) => {
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
              <ImageGallery
                images={images}
                caption={caption}
                mediaBaseUrl={config?.mediaBaseUrl}
              />,
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
      };
    };

    const mainHtml = await convertLexicalToHTMLAsync({
      className,
      converters: htmlConverters,
      data,
      disableContainer: !enableContainer,
    });

    // Collect footnote definitions and append a footnotes section if any exist.
    const footnoteDefs = collectFootnoteDefinitions(data);
    if (footnoteDefs.length === 0) {
      return mainHtml;
    }

    const definitionItems = await Promise.all(
      footnoteDefs.map(async (fn) => {
        const encodedId = encodeURIComponent(fn.footnoteId);
        // Render the definition body as rich text (re-uses the same config / converters).
        const bodyHtml = await renderRichTextToHTML(
          {
            data: {
              root: {
                type: "root",
                children: fn.children,
                format: "",
                indent: 0,
                version: 1,
                direction: fn.direction,
              },
            },
            enableContainer: false,
          },
          config,
        );
        return `<li id="fn-${encodedId}" class="footnote-item">${bodyHtml}<span class="footnote-backrefs"><a href="#fnref-${encodedId}" class="footnote-backref">↩</a></span></li>`;
      }),
    );

    const footnotesSection = `<section class="footnotes"><h2 class="footnotes-title">Footnotes</h2><ol>${definitionItems.join("")}</ol></section>`;

    return mainHtml + footnotesSection;
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
