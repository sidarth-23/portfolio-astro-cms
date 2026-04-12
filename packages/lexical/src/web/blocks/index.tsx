/** @jsxImportSource preact */
import { renderToStaticMarkup } from "preact-render-to-string";
import { Callout } from "./Callout";
import { Code } from "./Code";
import { ContentSection } from "./ContentSection";
import { ImageGallery } from "./ImageGallery";
import { highlightCode } from "./shiki";
import { renderRichTextToHTML, type RichTextRenderConfig } from "../render";
import type { RichTextValue } from "../types";

export type BlockRenderConfig = RichTextRenderConfig;

export async function renderBlock(block: Record<string, unknown>, config?: BlockRenderConfig): Promise<string> {
  switch (block.blockType) {
    case "contentSection": {
      const contentHtml = await renderRichTextToHTML({ data: block.content as any, enableContainer: false }, config);
      return renderToStaticMarkup(
        <ContentSection title={block.title as string | null} contentHtml={contentHtml} />,
      );
    }

    case "callout": {
      const contentHtml = await renderRichTextToHTML({ data: block.content as any, enableContainer: false }, config);
      return renderToStaticMarkup(
        <Callout
          variant={block.variant as string}
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
        return renderToStaticMarkup(
          <Code mode="multiple" entries={entries} caption={caption} />,
        );
      }

      // Single mode (default, backward compat with old filename-based blocks)
      const language = (block.language as string) || "plaintext";
      const code = (block.code as string) || "";
      const highlightedHtml = await highlightCode(code, language).catch(
        () => `<pre><code>${code}</code></pre>`,
      );
      return renderToStaticMarkup(
        <Code mode="single" language={language} highlightedHtml={highlightedHtml} caption={caption} />,
      );
    }

    case "imageGallery": {
      const caption = (block.caption as string | null | undefined) ?? null;
      const rawImages = (block.images as Array<{ image: any }> | null | undefined) ?? [];

      const images = await Promise.all(
        rawImages
          .filter((entry) => entry.image && typeof entry.image === "object" && entry.image.url)
          .map(async (entry) => {
            const doc = entry.image;
            const alt = (doc.alt as string) ?? "";
            const mediaCaption = doc.caption as RichTextValue | null | undefined;
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
    }

    default:
      return "";
  }
}

export async function renderBlocks(blocks: unknown[], config?: BlockRenderConfig): Promise<string> {
  const results = await Promise.all(
    (blocks as Record<string, unknown>[]).map((block) => renderBlock(block, config)),
  );
  return results.join("");
}
