"use client";

import { $convertFromMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import { $getRoot, COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from "lexical";
import { useEffect } from "react";

// Patterns that signal the text is markdown.
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,
  /^[-*]\s/m,
  /^\d+\.\s/m,
  /^>\s/m,
  /^```/m,
  /\*\*[^*]+\*\*/m,
  /\*[^*]+\*/m,
  /^---+$/m,
  /^___+$/m,
  /^\*\*\*+$/m,
  /\[[^\]]+\]\([^)]+\)/m,
  /`[^`]+`/m,
  /__[^_]+__/m,
];

function looksLikeMarkdown(text: string): boolean {
  const lines = text.split("\n");
  if (lines.length < 2) return false;

  const matchedPatterns = new Set<number>();

  for (const [i, pattern] of MARKDOWN_PATTERNS.entries()) {
    if (pattern.test(text)) {
      matchedPatterns.add(i);
    }
  }

  return matchedPatterns.size >= 2;
}

export function MarkdownPastePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const { editorConfig } = useEditorConfigContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (!(event instanceof ClipboardEvent)) return false;

        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        if (clipboardData.getData("application/x-lexical-editor")) return false;
        if (clipboardData.getData("text/html")) return false;

        const text = clipboardData.getData("text/plain");
        if (!text || !looksLikeMarkdown(text)) return false;

        event.preventDefault();

        const transformers = editorConfig.features.markdownTransformers ?? [];

        editor.update(() => {
          const root = $getRoot();
          root.clear();
          $convertFromMarkdownString(text, transformers);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, editorConfig.features.markdownTransformers]);

  return null;
}
