import { ElementNode, $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import type { SerializedElementNode } from "lexical";

export type SerializedFootnoteDefinitionNode = SerializedElementNode & {
  type: "footnote-definition";
  footnoteId: string;
  version: 1;
};

export class FootnoteDefinitionServerNode extends ElementNode {
  declare __footnoteId: string;

  constructor(footnoteId: string, key?: NodeKey) {
    super(key);
    this.__footnoteId = footnoteId;
  }

  static getType(): string {
    return "footnote-definition";
  }
  static clone(node: FootnoteDefinitionServerNode): FootnoteDefinitionServerNode {
    return new FootnoteDefinitionServerNode(node.__footnoteId, node.__key);
  }
  static importJSON(s: SerializedFootnoteDefinitionNode): FootnoteDefinitionServerNode {
    const node = $createFootnoteDefinitionServerNode(s.footnoteId);
    node.setFormat(s.format);
    node.setIndent(s.indent);
    node.setDirection(s.direction);
    return node;
  }

  exportJSON(): SerializedFootnoteDefinitionNode {
    return {
      ...super.exportJSON(),
      type: "footnote-definition",
      footnoteId: this.__footnoteId,
      version: 1,
    };
  }

  getFootnoteId(): string {
    return this.getLatest().__footnoteId;
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div");
    el.setAttribute("data-footnote-id", this.__footnoteId);
    el.classList.add("footnote-definition");
    el.style.display = "list-item";
    el.style.listStyleType = "decimal";
    el.style.listStylePosition = "outside";
    el.style.marginLeft = "1.5em";
    return el;
  }
  updateDOM(): boolean {
    return false;
  }
  isInline(): boolean {
    return false;
  }
  canBeEmpty(): boolean {
    return false;
  }
}

export function $createFootnoteDefinitionServerNode(
  footnoteId: string,
): FootnoteDefinitionServerNode {
  return $applyNodeReplacement(new FootnoteDefinitionServerNode(footnoteId));
}
export function $isFootnoteDefinitionServerNode(
  node: LexicalNode | null | undefined,
): node is FootnoteDefinitionServerNode {
  return node instanceof FootnoteDefinitionServerNode;
}
