import { getSingletonHighlighter } from "shiki";

export async function highlightCode(code: string, language: string): Promise<string> {
  const highlighter = await getSingletonHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [language as any],
  });

  return highlighter.codeToHtml(code, {
    lang: language,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });
}
