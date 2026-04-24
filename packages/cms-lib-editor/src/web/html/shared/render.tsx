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
import { indexFootnotes, type SerializedFootnoteDefinitionNode } from "./footnotes";

// ---------------------------------------------------------------------------
// Footnote node shapes (serialized from Lexical)
// ---------------------------------------------------------------------------

type SerializedAbbreviationRegistryNode = {
  type: "abbreviation-registry";
  abbreviations: Record<string, string>;
  version: number;
};

type SerializedFootnoteReferenceNode = {
  type: "footnote-reference";
  footnoteId: string;
  version: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const collectAbbreviationRegistries = (
  data: RichTextValue,
): SerializedAbbreviationRegistryNode[] => {
  if (!Array.isArray(data?.root?.children)) return [];
  return (data.root.children as unknown[]).filter(
    (n): n is SerializedAbbreviationRegistryNode =>
      typeof n === "object" &&
      n !== null &&
      (n as { type?: string }).type === "abbreviation-registry",
  );
};

const applyAbbreviations = (html: string, abbreviations: Record<string, string>): string => {
  const keys = Object.keys(abbreviations).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return html;

  // Pre-compile all regexes once (not inside the parts.map loop).
  // Uses lookbehind/lookahead instead of \b for keys that start/end with non-\w characters
  // (e.g. C++, .NET, Node.js) so they are not silently skipped.
  const compiled = keys
    .filter((key) => key.length > 0) // guard against empty keys
    .map((key) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const title = escapeHtml(abbreviations[key]!);
      const escapedDisplay = escapeHtml(key);
      const startBoundary = /^\w/.test(key) ? "\\b" : "(?<![\\w])";
      const endBoundary = /\w$/.test(key) ? "\\b" : "(?![\\w])";
      return {
        re: new RegExp(`${startBoundary}${escapedKey}${endBoundary}`, "g"),
        title,
        escapedDisplay,
      };
    });

  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // tag segment — skip
      for (const { re, title, escapedDisplay } of compiled) {
        re.lastIndex = 0; // reset global regex state between segments
        part = part.replace(re, `<abbr title="${title}">${escapedDisplay}</abbr>`);
      }
      return part;
    })
    .join("");
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
  const { Callout, Code, Footnotes, Upload, ImageGallery } = components;

  const renderRichTextToHTML = async (
    { className, data, enableContainer = false }: RichTextRenderOptions,
    config?: RichTextRenderConfig,
  ): Promise<string> => {
    if (!data) return "";

    const internalDocToHref = createInternalDocHrefResolver(config?.internalDocHrefRouteMap);
    const profile = config?.calloutVariantProfile ?? "generic";
    const fallbackVariant = fallbackVariantByProfile[profile];
    const footnoteIndex = indexFootnotes(data);
    const displayNumberById = new Map<string, number>();
    footnoteIndex.orderedReferenceIds.forEach((id, index) => {
      displayNumberById.set(id, index + 1);
    });
    const renderedRefCountById = new Map<string, number>();

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
          const referenceCount = (renderedRefCountById.get(fn.footnoteId) ?? 0) + 1;
          renderedRefCountById.set(fn.footnoteId, referenceCount);

          const displayNumber = displayNumberById.get(fn.footnoteId);
          const label =
            displayNumber === undefined ? escapeHtml(fn.footnoteId) : String(displayNumber);
          const encodedId = encodeURIComponent(fn.footnoteId);
          const anchorId = `fnref-${encodedId}-${referenceCount}`;

          return `<sup class="footnote-ref"><a href="#fn-${encodedId}" id="${anchorId}">${label}</a></sup>`;
        },
        // Definitions are rendered as a footnotes section after the main HTML (see post-processing below);
        // suppress inline output to avoid duplicating content.
        "footnote-definition": () => "",
        // Registry is metadata only — invisible in rendered output; abbreviations are applied in post-processing.
        "abbreviation-registry": () => "",
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

    // Collect abbreviation registries and apply to main HTML if any exist.
    const abbrevRegistries = collectAbbreviationRegistries(data);
    let processedHtml = mainHtml;
    if (abbrevRegistries.length > 0) {
      const mergedAbbreviations: Record<string, string> = {};
      for (const registry of abbrevRegistries) {
        Object.assign(mergedAbbreviations, registry.abbreviations);
      }
      processedHtml = applyAbbreviations(mainHtml, mergedAbbreviations);
    }

    if (footnoteIndex.orderedDefinitionIds.length === 0) {
      return processedHtml;
    }

    const definitionItems = await Promise.all(
      footnoteIndex.orderedDefinitionIds.map(async (footnoteId) => {
        const fn: SerializedFootnoteDefinitionNode | undefined =
          footnoteIndex.definitionById.get(footnoteId);
        if (!fn) {
          return null;
        }

        const encodedId = encodeURIComponent(footnoteId);
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

        const referenceAnchors = footnoteIndex.referenceAnchorIdsById.get(footnoteId) ?? [];
        const firstReferenceAnchor = referenceAnchors[0];

        return {
          id: `fn-${encodedId}`,
          bodyHtml,
          referenceHref: firstReferenceAnchor ? `#${firstReferenceAnchor}` : undefined,
          referenceLabel: "Back to reference",
        };
      }),
    );

    const items = definitionItems.filter((item): item is NonNullable<typeof item> => item !== null);
    const footnotesSection = renderToStaticMarkup(<Footnotes title="Footnotes" items={items} />);

    return processedHtml + footnotesSection;
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
