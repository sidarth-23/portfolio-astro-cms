"use client";

import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  type ElementNode,
  type LexicalNode,
} from "lexical";

import {
  $createFootnoteDefinitionNode,
  $isFootnoteDefinitionNode,
} from "../nodes/FootnoteDefinitionNode.client";
import { $isFootnoteReferenceNode } from "../nodes/FootnoteReferenceNode.client";

type FootnoteDefinitionLike = ElementNode & {
  getFootnoteId: () => string;
};

type FootnoteReferenceLike = LexicalNode & {
  getDisplayIndex: () => null | number;
  getFootnoteId: () => string;
  getReferenceCount: () => number;
  setDisplayIndex: (displayIndex: null | number) => FootnoteReferenceLike;
  setReferenceCount: (referenceCount: number) => FootnoteReferenceLike;
};

export type FootnotePanelEntry = {
  displayIndex: number;
  id: string;
  text: string;
};

export type FootnoteSnapshot = {
  displayIndexById: Record<string, number>;
  entries: FootnotePanelEntry[];
  shouldNormalize: boolean;
};

const toDefinitionNode = (node: LexicalNode): FootnoteDefinitionLike | null => {
  if (!$isFootnoteDefinitionNode(node)) {
    return null;
  }

  const withId = node as unknown as FootnoteDefinitionLike;
  if (typeof withId.getFootnoteId !== "function") {
    return null;
  }

  return withId;
};

const serializeDefinitionText = (definitionNode: FootnoteDefinitionLike): string => {
  const paragraphs = definitionNode
    .getChildren()
    .map((child) => child.getTextContent())
    .join("\n");

  return paragraphs;
};

const walkReferences = (node: LexicalNode, output: string[]): void => {
  if ($isFootnoteReferenceNode(node)) {
    const footnoteId = node.getFootnoteId();
    if (footnoteId) {
      output.push(footnoteId);
    }
    return;
  }

  if ($isFootnoteDefinitionNode(node)) {
    return;
  }

  if (!$isElementNode(node)) {
    return;
  }

  for (const child of node.getChildren()) {
    walkReferences(child, output);
  }
};

const toReferenceNode = (node: LexicalNode): FootnoteReferenceLike | null => {
  if (!$isFootnoteReferenceNode(node)) {
    return null;
  }

  const withMeta = node as unknown as FootnoteReferenceLike;
  if (
    typeof withMeta.getDisplayIndex !== "function" ||
    typeof withMeta.getFootnoteId !== "function" ||
    typeof withMeta.getReferenceCount !== "function" ||
    typeof withMeta.setDisplayIndex !== "function" ||
    typeof withMeta.setReferenceCount !== "function"
  ) {
    return null;
  }

  return withMeta;
};

const walkReferenceNodes = (
  node: LexicalNode,
  onReference: (node: FootnoteReferenceLike) => void,
): void => {
  const refNode = toReferenceNode(node);
  if (refNode) {
    onReference(refNode);
    return;
  }

  if ($isFootnoteDefinitionNode(node)) {
    return;
  }

  if (!$isElementNode(node)) {
    return;
  }

  for (const child of node.getChildren()) {
    walkReferenceNodes(child, onReference);
  }
};

const buildDisplayIndexById = (referenceSequence: string[]): Record<string, number> => {
  const displayIndexById: Record<string, number> = {};
  let nextIndex = 1;

  for (const id of referenceSequence) {
    if (displayIndexById[id]) {
      continue;
    }

    displayIndexById[id] = nextIndex;
    nextIndex += 1;
  }

  return displayIndexById;
};

const getPanelEntries = (
  displayIndexById: Record<string, number>,
  definitionsById: Map<string, FootnoteDefinitionLike>,
): FootnotePanelEntry[] => {
  return Object.entries(displayIndexById)
    .sort((a, b) => a[1] - b[1])
    .map(([id, displayIndex]) => {
      return {
        displayIndex,
        id,
        text: definitionsById.has(id)
          ? serializeDefinitionText(definitionsById.get(id) as FootnoteDefinitionLike)
          : "",
      };
    });
};

const ensureDefinitionTextNode = (definitionNode: FootnoteDefinitionLike, text: string): void => {
  for (const child of definitionNode.getChildren()) {
    child.remove();
  }

  const lines = text.split(/\r?\n/);
  if (lines.length === 0) {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(""));
    definitionNode.append(paragraph);
    return;
  }

  for (const line of lines) {
    const paragraph = $createParagraphNode();
    if (line.length > 0) {
      paragraph.append($createTextNode(line));
    }
    definitionNode.append(paragraph);
  }

  if (definitionNode.getChildrenSize() === 0) {
    const paragraph = $createParagraphNode();
    paragraph.append($createTextNode(""));
    definitionNode.append(paragraph);
  }
};

export const readFootnoteSnapshot = (): FootnoteSnapshot => {
  const root = $getRoot();
  const definitionsById = new Map<string, FootnoteDefinitionLike>();
  const duplicateDefinitionIds: string[] = [];
  let hasNonDefinitionAfterDefinition = false;
  let hasSeenDefinition = false;

  for (const child of root.getChildren()) {
    const definitionNode = toDefinitionNode(child);

    if (definitionNode) {
      hasSeenDefinition = true;
      const id = definitionNode.getFootnoteId();
      if (definitionsById.has(id)) {
        duplicateDefinitionIds.push(id);
      } else {
        definitionsById.set(id, definitionNode);
      }
      continue;
    }

    if (hasSeenDefinition) {
      hasNonDefinitionAfterDefinition = true;
    }
  }

  const referenceSequence: string[] = [];
  for (const child of root.getChildren()) {
    walkReferences(child, referenceSequence);
  }

  const displayIndexById = buildDisplayIndexById(referenceSequence);
  const panelEntries = getPanelEntries(displayIndexById, definitionsById);

  const referencedIdSet = new Set(panelEntries.map((entry) => entry.id));
  const orphanDefinitionExists = [...definitionsById.keys()].some((id) => !referencedIdSet.has(id));
  const missingDefinitionExists = panelEntries.some((entry) => !definitionsById.has(entry.id));
  const rootDefinitionOrder = root
    .getChildren()
    .map((child) => toDefinitionNode(child))
    .filter((node): node is FootnoteDefinitionLike => Boolean(node))
    .map((node) => node.getFootnoteId())
    .filter((id, index, array) => array.indexOf(id) === index)
    .filter((id) => referencedIdSet.has(id));
  const expectedDefinitionOrder = panelEntries.map((entry) => entry.id);
  const isOrderMismatched =
    rootDefinitionOrder.length !== expectedDefinitionOrder.length ||
    rootDefinitionOrder.some((id, index) => expectedDefinitionOrder[index] !== id);

  return {
    displayIndexById,
    entries: panelEntries,
    shouldNormalize:
      duplicateDefinitionIds.length > 0 ||
      orphanDefinitionExists ||
      missingDefinitionExists ||
      isOrderMismatched ||
      hasNonDefinitionAfterDefinition,
  };
};

export const normalizeFootnotes = (): void => {
  const root = $getRoot();
  const snapshot = readFootnoteSnapshot();
  const orderedReferencedIds = snapshot.entries.map((entry) => entry.id);
  const referencedIdSet = new Set(orderedReferencedIds);
  const definitionsById = new Map<string, FootnoteDefinitionLike>();

  for (const child of root.getChildren()) {
    const definitionNode = toDefinitionNode(child);
    if (!definitionNode) {
      continue;
    }

    const id = definitionNode.getFootnoteId();

    if (!referencedIdSet.has(id)) {
      definitionNode.remove();
      continue;
    }

    if (definitionsById.has(id)) {
      definitionNode.remove();
      continue;
    }

    definitionsById.set(id, definitionNode);
  }

  for (const id of orderedReferencedIds) {
    if (definitionsById.has(id)) {
      continue;
    }

    const definitionNode = $createFootnoteDefinitionNode(id) as unknown as FootnoteDefinitionLike;
    ensureDefinitionTextNode(definitionNode, "");
    definitionsById.set(id, definitionNode);
    root.append(definitionNode);
  }

  for (const id of orderedReferencedIds) {
    const definitionNode = definitionsById.get(id);
    if (!definitionNode) {
      continue;
    }

    if (definitionNode.getChildrenSize() === 0) {
      ensureDefinitionTextNode(definitionNode, "");
    }

    root.append(definitionNode);
  }
};

export const updateFootnoteDefinitionText = (id: string, text: string): void => {
  const root = $getRoot();
  let definitionNode: FootnoteDefinitionLike | null = null;

  for (const child of root.getChildren()) {
    const maybeDefinition = toDefinitionNode(child);
    if (!maybeDefinition) {
      continue;
    }

    if (maybeDefinition.getFootnoteId() === id) {
      definitionNode = maybeDefinition;
      break;
    }
  }

  if (!definitionNode) {
    const created = $createFootnoteDefinitionNode(id) as unknown as FootnoteDefinitionLike;
    definitionNode = created;
    root.append(created);
  }

  ensureDefinitionTextNode(definitionNode, text);
};

const iterateReferencesWithOrder = (
  displayIndexById: Record<string, number>,
  onReference: (args: { count: number; displayIndex: number; node: FootnoteReferenceLike }) => void,
): void => {
  const root = $getRoot();
  const countsById = new Map<string, number>();

  for (const child of root.getChildren()) {
    walkReferenceNodes(child, (node) => {
      const id = node.getFootnoteId();
      if (!id) {
        return;
      }

      const count = (countsById.get(id) ?? 0) + 1;
      countsById.set(id, count);

      onReference({
        count,
        displayIndex: displayIndexById[id] ?? count,
        node,
      });
    });
  }
};

export const isReferencePresentationOutdated = (
  displayIndexById: Record<string, number>,
): boolean => {
  let outdated = false;

  iterateReferencesWithOrder(displayIndexById, ({ count, displayIndex, node }) => {
    if (outdated) {
      return;
    }

    if (node.getDisplayIndex() !== displayIndex || node.getReferenceCount() !== count) {
      outdated = true;
    }
  });

  return outdated;
};

export const syncReferencePresentation = (displayIndexById: Record<string, number>): void => {
  iterateReferencesWithOrder(displayIndexById, ({ count, displayIndex, node }) => {
    if (node.getReferenceCount() !== count) {
      node.setReferenceCount(count);
    }

    if (node.getDisplayIndex() !== displayIndex) {
      node.setDisplayIndex(displayIndex);
    }
  });
};
