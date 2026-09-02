/** @jsxImportSource @qwik.dev/core */
import { component$, useVisibleTask$ } from "@qwik.dev/core";
import { initRichTextInteractions } from "@/lib/rich-text/html/client";

export const RichTextInteractions = component$(() => {
  // The interaction module owns DOM enhancement for server-rendered rich text.
  // Reinitialization after Astro view transitions stays inside that module.
  useVisibleTask$(({ cleanup }) => {
    cleanup(initRichTextInteractions());
  });

  return <span hidden aria-hidden="true" />;
});
