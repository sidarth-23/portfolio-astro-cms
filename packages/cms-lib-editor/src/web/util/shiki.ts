import { getSingletonHighlighter } from "shiki";
import type { BundledLanguage } from "shiki";

export async function highlightCode(code: string, language: string): Promise<string> {
  const highlighter = await getSingletonHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [language as BundledLanguage],
  });

  return highlighter.codeToHtml(code, {
    lang: language,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
}
