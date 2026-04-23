import { ElementNode, $applyNodeReplacement, type LexicalNode } from "lexical";
import type { SerializedElementNode } from "lexical";

export type SerializedDefinitionListNode = SerializedElementNode & {
  type: "definition-list";
  version: 1;
};

export class DefinitionListServerNode extends ElementNode {
  static getType(): string {
    return "definition-list";
  }

  static clone(node: DefinitionListServerNode): DefinitionListServerNode {
    return new DefinitionListServerNode(node.__key);
  }

  static importJSON(_s: SerializedDefinitionListNode): DefinitionListServerNode {
    const node = $createDefinitionListServerNode();
    node.setFormat(_s.format);
    node.setIndent(_s.indent);
    node.setDirection(_s.direction);
    return node;
  }

  exportJSON(): SerializedDefinitionListNode {
    return {
      ...super.exportJSON(),
      type: "definition-list",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("dl");
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

export function $createDefinitionListServerNode(): DefinitionListServerNode {
  return $applyNodeReplacement(new DefinitionListServerNode());
}

export function $isDefinitionListServerNode(
  node: LexicalNode | null | undefined,
): node is DefinitionListServerNode {
  return node instanceof DefinitionListServerNode;
}
