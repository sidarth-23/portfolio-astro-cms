import { DecoratorNode, $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import type { SerializedLexicalNode } from "lexical";

export type SerializedAbbreviationRegistryNode = SerializedLexicalNode & {
  type: "abbreviation-registry";
  abbreviations: Record<string, string>;
  version: 1;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class AbbreviationRegistryServerNode extends DecoratorNode<any> {
  declare __abbreviations: Record<string, string>;

  constructor(abbreviations: Record<string, string>, key?: NodeKey) {
    super(key);
    this.__abbreviations = abbreviations;
  }

  static getType(): string {
    return "abbreviation-registry";
  }

  static clone(node: AbbreviationRegistryServerNode): AbbreviationRegistryServerNode {
    return new AbbreviationRegistryServerNode(node.__abbreviations, node.__key);
  }

  static importJSON(
    serialized: SerializedAbbreviationRegistryNode,
  ): AbbreviationRegistryServerNode {
    return $createAbbreviationRegistryServerNode(serialized.abbreviations);
  }

  exportJSON(): SerializedAbbreviationRegistryNode {
    return {
      ...super.exportJSON(),
      type: "abbreviation-registry",
      abbreviations: this.__abbreviations,
      version: 1,
    };
  }

  getAbbreviations(): Record<string, string> {
    return this.getLatest().__abbreviations;
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  createDOM(): HTMLElement {
    return document.createElement("div");
  }

  updateDOM(): boolean {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decorate(): any {
    return null; // overridden in the client subclass to return a React element
  }
}

export function $createAbbreviationRegistryServerNode(
  abbreviations: Record<string, string>,
): AbbreviationRegistryServerNode {
  return $applyNodeReplacement(new AbbreviationRegistryServerNode(abbreviations));
}

export function $isAbbreviationRegistryServerNode(
  node: LexicalNode | null | undefined,
): node is AbbreviationRegistryServerNode {
  return node instanceof AbbreviationRegistryServerNode;
}
