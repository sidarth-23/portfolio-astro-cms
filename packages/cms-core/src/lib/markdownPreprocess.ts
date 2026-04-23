import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Image, Paragraph, Root } from "mdast";

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isSingleImageParagraph = (node: Paragraph): node is Paragraph & { children: [Image] } => {
  return (
    node.type === "paragraph" &&
    node.children.length === 1 &&
    node.children[0]!.type === "image" &&
    isHttpUrl((node.children[0] as Image).url)
  );
};

const parseMarkdown = (markdown: string): Root => {
  return fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
};

type ConsecutiveImageRun = {
  /** Offset of the first character of the first paragraph node */
  start: number;
  /** Offset just past the last character of the last paragraph node */
  end: number;
  /** The inner markdown fragment (all image lines) */
  inner: string;
};

/**
 * Pre-processes markdown for Payload's block conversion.
 * Uses mdast for detection — no hand-written regex.
 *
 * Rules:
 * - 2+ consecutive standalone HTTP images → <imageGallery>...</imageGallery>
 *
 * Extensible: add new mdast-based rules here for future blocks.
 */
export const preprocessMarkdownForPayload = (markdown: string): string => {
  if (!markdown.trim()) {
    return markdown;
  }

  const root = parseMarkdown(markdown);

  // Collect runs of 2+ consecutive single-image paragraphs that are direct
  // children of the root node.
  const runs: ConsecutiveImageRun[] = [];
  let runStart: number | null = null;
  let runEnd: number | null = null;
  let runInner = "";

  const flushRun = () => {
    if (runStart !== null && runEnd !== null) {
      runs.push({ start: runStart, end: runEnd, inner: runInner.trimEnd() });
    }
    runStart = null;
    runEnd = null;
    runInner = "";
  };

  for (const child of root.children) {
    if (child.type !== "paragraph" || !isSingleImageParagraph(child)) {
      flushRun();
      continue;
    }

    const start = child.position?.start?.offset;
    const end = child.position?.end?.offset;

    if (typeof start !== "number" || typeof end !== "number") {
      flushRun();
      continue;
    }

    const imageNode = child.children[0] as Image;
    const alt = imageNode.alt ?? "";
    const url = imageNode.url;
    const imageLine = `![${alt}](${url})\n`;

    if (runStart === null) {
      // Start a new potential run
      runStart = start;
      runEnd = end;
      runInner = imageLine;
    } else {
      // Extend the current run
      runEnd = end;
      runInner += imageLine;
    }
  }

  flushRun();

  // Only keep runs of 2+ images
  const replacements = runs
    .filter(() => true)
    .filter((run) => {
      const imageCount = (run.inner.match(/^!\[/gm) ?? []).length;
      return imageCount >= 2;
    });

  if (replacements.length === 0) {
    return markdown;
  }

  // Apply replacements from end to start to preserve offsets
  return replacements
    .sort((a, b) => b.start - a.start)
    .reduce((current, run) => {
      const wrapped = `<imageGallery>\n${run.inner}\n</imageGallery>`;
      return current.slice(0, run.start) + wrapped + current.slice(run.end);
    }, markdown);
};
