import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { HTMLConvertersAsync } from "@payloadcms/richtext-lexical/html-async";

export type TableClassConfig = {
  table?: string;
  thead?: string;
  tbody?: string;
  tr?: string;
  th?: string;
  td?: string;
};

type SerializedCell = {
  type: string;
  headerState?: number;
  colSpan?: number;
  rowSpan?: number;
  children: unknown[];
};

type SerializedRow = {
  type: string;
  children: SerializedCell[];
};

/**
 * Creates clean semantic table HTML converters, replacing Payload's default
 * `TableHTMLConverterAsync` which hard-codes `lexical-*` classes and inline styles.
 *
 * Pass a `TableClassConfig` to apply classes to individual table elements.
 * Omitting a field (or passing no config) emits no `class` attribute for that element.
 *
 * Features:
 * - No `<div class="lexical-table-container">` wrapper
 * - Smart `<thead>` detection: if the first row is all header cells, wraps it in `<thead>`
 * - Preserves `colspan`/`rowspan` attributes
 * - Drops `backgroundColor` and all inline styles
 */
export function createTableConverters(
  classes?: TableClassConfig,
): HTMLConvertersAsync<DefaultNodeTypes> {
  const attr = (cls?: string) => (cls ? ` class="${cls}"` : "");

  return {
    table: async ({ node, nodesToHTML }) => {
      const rows = node.children as unknown as SerializedRow[];

      const firstRow = rows[0];
      const hasHeaderRow =
        firstRow != null &&
        Array.isArray(firstRow.children) &&
        firstRow.children.length > 0 &&
        firstRow.children.every((cell) => (cell.headerState ?? 0) > 0);

      let theadHtml = "";
      let tbodyHtml = "";

      if (hasHeaderRow) {
        const [headerRow, ...bodyRows] = rows;
        const headerRendered = (
          await nodesToHTML({ nodes: [headerRow as unknown as (typeof node.children)[number]] })
        ).join("");
        theadHtml = `<thead${attr(classes?.thead)}>${headerRendered}</thead>`;
        if (bodyRows.length > 0) {
          const bodyRendered = (
            await nodesToHTML({ nodes: bodyRows as unknown as typeof node.children })
          ).join("");
          tbodyHtml = `<tbody${attr(classes?.tbody)}>${bodyRendered}</tbody>`;
        }
      } else {
        const allRendered = (await nodesToHTML({ nodes: node.children })).join("");
        tbodyHtml = `<tbody${attr(classes?.tbody)}>${allRendered}</tbody>`;
      }

      return `<table${attr(classes?.table)}>${theadHtml}${tbodyHtml}</table>`;
    },

    tablerow: async ({ node, nodesToHTML }) => {
      const children = (await nodesToHTML({ nodes: node.children })).join("");
      return `<tr${attr(classes?.tr)}>${children}</tr>`;
    },

    tablecell: async ({ node, nodesToHTML }) => {
      const typedNode = node as unknown as SerializedCell;
      const isHeader = (typedNode.headerState ?? 0) > 0;
      const TagName = isHeader ? "th" : "td";
      const colSpanAttr =
        typedNode.colSpan != null && typedNode.colSpan > 1 ? ` colspan="${typedNode.colSpan}"` : "";
      const rowSpanAttr =
        typedNode.rowSpan != null && typedNode.rowSpan > 1 ? ` rowspan="${typedNode.rowSpan}"` : "";
      const children = (await nodesToHTML({ nodes: node.children })).join("");
      return `<${TagName}${colSpanAttr}${rowSpanAttr}${attr(isHeader ? classes?.th : classes?.td)}>${children}</${TagName}>`;
    },
  } as HTMLConvertersAsync<DefaultNodeTypes>;
}
