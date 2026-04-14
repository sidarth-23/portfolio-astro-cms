"use client";

import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND, $getRoot } from "lexical";
import { useEffect } from "react";

// Patterns that signal the text is markdown
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m, // ATX headings
  /^[-*]\s/m, // unordered list items
  /^\d+\.\s/m, // ordered list items
  /^>\s/m, // blockquotes
  /^```/m, // fenced code blocks
  /\*\*[^*]+\*\*/m, // bold **text**
  /\*[^*]+\*/m, // italic *text*
  /^---+$/m, // horizontal rule
  /^___+$/m, // horizontal rule
  /^\*\*\*+$/m, // horizontal rule
  /\[[^\]]+\]\([^)]+\)/m, // links [text](url)
  /`[^`]+`/m, // inline code
  /__[^_]+__/m, // bold __text__
];

function looksLikeMarkdown(text: string): boolean {
  const lines = text.split("\n");
  // Require at least 2 lines — single-line pastes stay as plain text
  if (lines.length < 2) return false;

  const matchedPatterns = new Set<number>();

  for (const [i, pattern] of MARKDOWN_PATTERNS.entries()) {
    if (pattern.test(text)) {
      matchedPatterns.add(i);
    }
  }

  // Require 2+ distinct markdown pattern types
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

        // Let Lexical JSON paste pass through unchanged
        if (clipboardData.getData("application/x-lexical-editor")) return false;

        // Let HTML paste pass through — the default HTML importer handles it
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
