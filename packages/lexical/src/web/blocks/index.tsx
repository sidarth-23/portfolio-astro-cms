/** @jsxImportSource preact */
import { renderToStaticMarkup } from "preact-render-to-string";
import { Callout } from "./Callout";
import { Code } from "./Code";
import { ContentSection } from "./ContentSection";
import { highlightCode } from "./shiki";
import { renderRichTextToHTML, type RichTextRenderConfig } from "../render";

export type BlockRenderConfig = RichTextRenderConfig;

export async function renderBlock(block: Record<string, unknown>, config?: BlockRenderConfig): Promise<string> {
  switch (block.blockType) {
    case "contentSection": {
      const contentHtml = renderRichTextToHTML({ data: block.content as any, enableContainer: false }, config);
      return renderToStaticMarkup(
        <ContentSection title={block.title as string | null} contentHtml={contentHtml} />,
      );
    }

    case "callout": {
      const contentHtml = renderRichTextToHTML({ data: block.content as any, enableContainer: false }, config);
      return renderToStaticMarkup(
        <Callout
          variant={block.variant as string}
          title={block.title as string | null}
          contentHtml={contentHtml}
        />,
      );
    }

    case "code": {
      const language = (block.language as string) || "plaintext";
      const code = (block.code as string) || "";
      const highlightedHtml = await highlightCode(code, language).catch(
        () => `<pre><code>${code}</code></pre>`,
      );
      return renderToStaticMarkup(
        <Code
          language={language}
          highlightedHtml={highlightedHtml}
          filename={block.filename as string | null}
          caption={block.caption as string | null}
        />,
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
