import type { Image, Paragraph } from "mdast";

import type { MarkdownPreprocessRule, MarkdownReplacement } from "../types";

type ConsecutiveImageRun = {
  end: number;
  imageCount: number;
  inner: string;
  start: number;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isPayloadMediaReferenceImage = (image: Image): boolean => {
  return (
    image.url.trim().length === 0 && typeof image.alt === "string" && image.alt.startsWith("media:")
  );
};

const isGalleryImage = (image: Image): boolean => {
  return isHttpUrl(image.url) || isPayloadMediaReferenceImage(image);
};

const isSingleImageParagraph = (node: Paragraph): node is Paragraph & { children: [Image] } => {
  return (
    node.type === "paragraph" &&
    node.children.length === 1 &&
    node.children[0]!.type === "image" &&
    isGalleryImage(node.children[0] as Image)
  );
};

export const collectImageGalleryReplacements: MarkdownPreprocessRule = ({ markdown, root }) => {
  const runs: ConsecutiveImageRun[] = [];
  let runStart: number | null = null;
  let runEnd: number | null = null;
  let runInner = "";
  let runImageCount = 0;

  const flushRun = () => {
    if (runStart !== null && runEnd !== null) {
      runs.push({
        start: runStart,
        end: runEnd,
        inner: runInner.trimEnd(),
        imageCount: runImageCount,
      });
    }

    runStart = null;
    runEnd = null;
    runInner = "";
    runImageCount = 0;
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

    const imageMarkdown = markdown.slice(start, end).trim();

    if (runStart === null) {
      runStart = start;
      runEnd = end;
      runInner = `${imageMarkdown}\n`;
      runImageCount = 1;
    } else {
      runEnd = end;
      runInner += `${imageMarkdown}\n`;
      runImageCount += 1;
    }
  }

  flushRun();

  return runs
    .filter((run) => run.imageCount >= 2)
    .map<MarkdownReplacement>((run) => {
      return {
        start: run.start,
        end: run.end,
        replacement: `<imageGallery>\n${run.inner}\n</imageGallery>`,
      };
    });
};
