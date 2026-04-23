import { ElementNode, $applyNodeReplacement, type LexicalNode } from "lexical";
import type { SerializedElementNode } from "lexical";

export type SerializedDefinitionDescriptionNode = SerializedElementNode & {
  type: "definition-description";
  version: 1;
};

export class DefinitionDescriptionServerNode extends ElementNode {
  static getType(): string {
    return "definition-description";
  }

  static clone(node: DefinitionDescriptionServerNode): DefinitionDescriptionServerNode {
    return new DefinitionDescriptionServerNode(node.__key);
  }

  static importJSON(_s: SerializedDefinitionDescriptionNode): DefinitionDescriptionServerNode {
    const node = $createDefinitionDescriptionServerNode();
    node.setFormat(_s.format);
    node.setIndent(_s.indent);
    node.setDirection(_s.direction);
    return node;
  }

  exportJSON(): SerializedDefinitionDescriptionNode {
    return {
      ...super.exportJSON(),
      type: "definition-description",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement("dd");
  }

  updateDOM(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createDefinitionDescriptionServerNode(): DefinitionDescriptionServerNode {
  return $applyNodeReplacement(new DefinitionDescriptionServerNode());
}

export function $isDefinitionDescriptionServerNode(
  node: LexicalNode | null | undefined,
): node is DefinitionDescriptionServerNode {
  return node instanceof DefinitionDescriptionServerNode;
}
