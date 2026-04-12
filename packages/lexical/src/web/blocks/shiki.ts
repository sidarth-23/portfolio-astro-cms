import { getSingletonHighlighter } from "shiki";

export async function highlightCode(code: string, language: string): Promise<string> {
  const highlighter = await getSingletonHighlighter({
    themes: ["github-dark"],
    langs: [language as any],
  });

  return highlighter.codeToHtml(code, {
    lang: language,
    theme: "github-dark",
  });
}
