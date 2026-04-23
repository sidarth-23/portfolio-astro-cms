"use client";
import { $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import {
  FootnoteDefinitionServerNode,
  type SerializedFootnoteDefinitionNode,
} from "./FootnoteDefinitionNode.server";

export class FootnoteDefinitionNode extends FootnoteDefinitionServerNode {
  constructor(footnoteId: string, key?: NodeKey) {
    super(footnoteId, key);
  }
  static getType() {
    return super.getType();
  }
  static clone(node: FootnoteDefinitionNode) {
    return new FootnoteDefinitionNode(node.__footnoteId, node.__key);
  }
  static importJSON(s: SerializedFootnoteDefinitionNode): FootnoteDefinitionNode {
    const node = $createFootnoteDefinitionNode(s.footnoteId);
    node.setFormat(s.format);
    node.setIndent(s.indent);
    node.setDirection(s.direction);
    return node;
  }
  createDOM(): HTMLElement {
    const el = document.createElement("div");
    el.setAttribute("data-footnote-id", this.__footnoteId);
    el.classList.add("footnote-definition");
    // Show a small label for the editor UI
    el.setAttribute("data-footnote-label", `[^${this.__footnoteId}]:`);
    return el;
  }

  // footnoteId is immutable after construction — no attributes to patch on update.
  updateDOM(): boolean {
    return false;
  }
}

export function $createFootnoteDefinitionNode(footnoteId: string): FootnoteDefinitionNode {
  return $applyNodeReplacement(new FootnoteDefinitionNode(footnoteId));
}
export function $isFootnoteDefinitionNode(
  node: LexicalNode | null | undefined,
): node is FootnoteDefinitionNode {
  return node instanceof FootnoteDefinitionNode;
}
