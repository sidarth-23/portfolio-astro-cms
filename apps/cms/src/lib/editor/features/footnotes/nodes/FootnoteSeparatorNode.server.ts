import { DecoratorNode, type LexicalNode, type NodeKey, type SerializedLexicalNode } from "lexical";

export type SerializedFootnoteSeparatorNode = SerializedLexicalNode & {
  type: "footnote-separator";
};

export class FootnoteSeparatorServerNode extends DecoratorNode<unknown> {
  static getType(): string {
    return "footnote-separator";
  }

  static clone(node: FootnoteSeparatorServerNode): FootnoteSeparatorServerNode {
    return new FootnoteSeparatorServerNode(node.__key);
  }

  static importJSON(_json: SerializedFootnoteSeparatorNode): FootnoteSeparatorServerNode {
    return new FootnoteSeparatorServerNode();
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  exportJSON(): SerializedFootnoteSeparatorNode {
    return {
      ...super.exportJSON(),
      type: "footnote-separator",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "false");
    el.style.userSelect = "none";
    el.style.marginTop = "3rem";
    return el;
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  decorate(): unknown {
    return null;
  }
}

export function $createFootnoteSeparatorServerNode(): FootnoteSeparatorServerNode {
  return new FootnoteSeparatorServerNode();
}

export function $isFootnoteSeparatorServerNode(
  node: LexicalNode | null | undefined,
): node is FootnoteSeparatorServerNode {
  return node instanceof FootnoteSeparatorServerNode;
}
