/** @jsxImportSource preact */
import {
  siTypescript,
  siJavascript,
  siHtml5,
  siCss,
  siPython,
  siGo,
  siRust,
  siGnubash,
  siJson,
  siYaml,
  siReact,
  type SimpleIcon,
} from "simple-icons";

const LANGUAGE_ICONS: Record<string, SimpleIcon> = {
  javascript: siJavascript,
  typescript: siTypescript,
  jsx: siReact,
  tsx: siReact,
  html: siHtml5,
  css: siCss,
  python: siPython,
  go: siGo,
  rust: siRust,
  bash: siGnubash,
  json: siJson,
  yaml: siYaml,
};

export const LanguageIcon = ({ language }: { language: string }) => {
  const icon = LANGUAGE_ICONS[language];
  if (!icon) return null;
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      fill="currentColor"
      class="shrink-0"
      aria-label={icon.title}
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
};

export const CopyIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);
