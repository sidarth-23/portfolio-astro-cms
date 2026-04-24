/** @jsxImportSource preact */
import codeSimpleSvg from "@phosphor-icons/core/assets/regular/code-simple.svg?raw";
import copySvg from "@phosphor-icons/core/assets/regular/copy.svg?raw";

const withIconAttrs = (svg: string, attrs: string): string => {
  return svg.replace(/<svg[^>]*>/i, `<svg ${attrs}>`);
};

const LANGUAGE_ICON_HTML = withIconAttrs(
  codeSimpleSvg,
  'aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor" class="shrink-0"',
);

const COPY_ICON_HTML = withIconAttrs(
  copySvg,
  'aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor" class="shrink-0"',
);

export const LanguageIcon = ({ language }: { language: string }) => {
  if (!language) return null;

  return <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: LANGUAGE_ICON_HTML }} />;
};

export const CopyIcon = () => (
  <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: COPY_ICON_HTML }} />
);
