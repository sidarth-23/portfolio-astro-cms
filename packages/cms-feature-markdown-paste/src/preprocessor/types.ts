import type { Root } from "mdast";

export type MarkdownReplacement = {
  end: number;
  replacement: string;
  start: number;
};

export type MarkdownPreprocessContext = {
  markdown: string;
  root: Root;
};

export type MarkdownPreprocessRule = (context: MarkdownPreprocessContext) => MarkdownReplacement[];
