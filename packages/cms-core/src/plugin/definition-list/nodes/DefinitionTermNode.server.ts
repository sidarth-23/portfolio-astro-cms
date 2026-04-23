import { ElementNode, $applyNodeReplacement, type LexicalNode } from "lexical";
import type { SerializedElementNode } from "lexical";

export type SerializedDefinitionTermNode = SerializedElementNode & {
  type: "definition-term";
  version: 1;
};

export class DefinitionTermServerNode extends ElementNode {
  static getType(): string {
    return "definition-term";
  }

  static clone(node: DefinitionTermServerNode): DefinitionTermServerNode {
    return new DefinitionTermServerNode(node.__key);
  }

  static importJSON(_s: SerializedDefinitionTermNode): DefinitionTermServerNode {
    const node = $createDefinitionTermServerNode();
    node.setFormat(_s.format);
    node.setIndent(_s.indent);
    node.setDirection(_s.direction);
    return node;
  }

  exportJSON(): SerializedDefinitionTermNode {
    return {
      ...super.exportJSON(),
      type: "definition-term",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("dt");
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createDefinitionTermServerNode(): DefinitionTermServerNode {
  return $applyNodeReplacement(new DefinitionTermServerNode());
}

export function $isDefinitionTermServerNode(
  node: LexicalNode | null | undefined,
): node is DefinitionTermServerNode {
  return node instanceof DefinitionTermServerNode;
}
