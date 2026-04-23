import { DecoratorNode, $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import type { SerializedLexicalNode } from "lexical";
import type { ReactElement } from "react";

export type SerializedFootnoteReferenceNode = SerializedLexicalNode & {
  type: "footnote-reference";
  footnoteId: string;
  version: 1;
};

export class FootnoteReferenceServerNode extends DecoratorNode<ReactElement | null> {
  declare __footnoteId: string;

  constructor(footnoteId: string, key?: NodeKey) {
    super(key);
    this.__footnoteId = footnoteId;
  }

  static getType(): string {
    return "footnote-reference";
  }
  static clone(node: FootnoteReferenceServerNode): FootnoteReferenceServerNode {
    return new FootnoteReferenceServerNode(node.__footnoteId, node.__key);
  }
  static importJSON(s: SerializedFootnoteReferenceNode): FootnoteReferenceServerNode {
    return $createFootnoteReferenceServerNode(s.footnoteId);
  }

  exportJSON(): SerializedFootnoteReferenceNode {
    return {
      ...super.exportJSON(),
      type: "footnote-reference",
      footnoteId: this.__footnoteId,
      version: 1,
    };
  }

  getTextContent(): string {
    return `[^${this.__footnoteId}]`;
  }

  getFootnoteId(): string {
    return this.getLatest().__footnoteId;
  }

  createDOM(): HTMLElement {
    const el = document.createElement("sup");
    el.setAttribute("data-footnote-id", this.__footnoteId);
    el.classList.add("footnote-ref");
    return el;
  }
  updateDOM(): boolean {
    return false;
  }
  isInline(): boolean {
    return true;
  }
  decorate(): ReactElement | null {
    return null; // overridden in the client subclass to return a React element
  }
}

export function $createFootnoteReferenceServerNode(
  footnoteId: string,
): FootnoteReferenceServerNode {
  return $applyNodeReplacement(new FootnoteReferenceServerNode(footnoteId));
}
export function $isFootnoteReferenceServerNode(
  node: LexicalNode | null | undefined,
): node is FootnoteReferenceServerNode {
  return node instanceof FootnoteReferenceServerNode;
}
