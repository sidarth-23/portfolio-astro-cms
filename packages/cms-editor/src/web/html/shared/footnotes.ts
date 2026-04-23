import type { RichTextValue } from "../types";

type SerializedFootnoteReferenceNode = {
  type: "footnote-reference";
  footnoteId: string;
  version: number;
};

export type SerializedFootnoteDefinitionNode = {
  type: "footnote-definition";
  footnoteId: string;
  children: RichTextValue["root"]["children"];
  format: number;
  indent: number;
  direction: "ltr" | "rtl" | null;
  version: number;
};

type SerializedNodeLike = {
  type?: string;
  children?: unknown[];
};

export type FootnoteIndex = {
  definitionById: Map<string, SerializedFootnoteDefinitionNode>;
  orderedDefinitionIds: string[];
  orderedReferenceIds: string[];
  referenceAnchorIdsById: Map<string, string[]>;
  referenceCountById: Map<string, number>;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isFootnoteReferenceNode = (value: unknown): value is SerializedFootnoteReferenceNode => {
  if (!isObject(value)) {
    return false;
  }

  return value.type === "footnote-reference" && typeof value.footnoteId === "string";
};

const isFootnoteDefinitionNode = (value: unknown): value is SerializedFootnoteDefinitionNode => {
  if (!isObject(value)) {
    return false;
  }

  return value.type === "footnote-definition" && typeof value.footnoteId === "string";
};

const walkForReferences = (
  node: unknown,
  onReference: (footnoteId: string) => void,
  skipDefinitions: boolean,
): void => {
  if (!isObject(node)) {
    return;
  }

  if (isFootnoteReferenceNode(node)) {
    onReference(node.footnoteId);
  }

  if (skipDefinitions && isFootnoteDefinitionNode(node)) {
    return;
  }

  const typedNode = node as SerializedNodeLike;
  if (!Array.isArray(typedNode.children)) {
    return;
  }

  for (const child of typedNode.children) {
    walkForReferences(child, onReference, skipDefinitions);
  }
};

export const indexFootnotes = (data: RichTextValue): FootnoteIndex => {
  const rootChildren = Array.isArray(data?.root?.children) ? data.root.children : [];

  const definitionById = new Map<string, SerializedFootnoteDefinitionNode>();
  const definitionOrder: string[] = [];
  const orderedReferenceIds: string[] = [];
  const referenceCountById = new Map<string, number>();
  const referenceAnchorIdsById = new Map<string, string[]>();

  for (const child of rootChildren) {
    if (!isFootnoteDefinitionNode(child)) {
      continue;
    }

    if (definitionById.has(child.footnoteId)) {
      continue;
    }

    definitionById.set(child.footnoteId, child);
    definitionOrder.push(child.footnoteId);
  }

  const seenReferenceIds = new Set<string>();
  const pushReference = (footnoteId: string) => {
    const count = (referenceCountById.get(footnoteId) ?? 0) + 1;
    referenceCountById.set(footnoteId, count);

    if (!seenReferenceIds.has(footnoteId)) {
      seenReferenceIds.add(footnoteId);
      orderedReferenceIds.push(footnoteId);
    }

    const encodedId = encodeURIComponent(footnoteId);
    const anchorId = `fnref-${encodedId}-${count}`;
    const existingAnchors = referenceAnchorIdsById.get(footnoteId) ?? [];
    existingAnchors.push(anchorId);
    referenceAnchorIdsById.set(footnoteId, existingAnchors);
  };

  for (const child of rootChildren) {
    walkForReferences(child, pushReference, true);
  }

  const orderedDefinitionIds: string[] = [];
  const seenDefinitionIds = new Set<string>();

  for (const id of orderedReferenceIds) {
    if (!definitionById.has(id) || seenDefinitionIds.has(id)) {
      continue;
    }

    seenDefinitionIds.add(id);
    orderedDefinitionIds.push(id);
  }

  for (const id of definitionOrder) {
    if (seenDefinitionIds.has(id)) {
      continue;
    }

    seenDefinitionIds.add(id);
    orderedDefinitionIds.push(id);
  }

  return {
    definitionById,
    orderedDefinitionIds,
    orderedReferenceIds,
    referenceAnchorIdsById,
    referenceCountById,
  };
};
