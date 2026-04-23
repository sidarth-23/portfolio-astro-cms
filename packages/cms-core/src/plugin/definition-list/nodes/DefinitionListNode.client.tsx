"use client";
import { $applyNodeReplacement, type LexicalNode } from "lexical";
import {
  DefinitionListServerNode,
  type SerializedDefinitionListNode,
} from "./DefinitionListNode.server";

export class DefinitionListNode extends DefinitionListServerNode {
  static getType() {
    return super.getType();
  }

  static clone(node: DefinitionListNode): DefinitionListNode {
    return new DefinitionListNode(node.__key);
  }

  static importJSON(s: SerializedDefinitionListNode): DefinitionListNode {
    const node = $createDefinitionListNode();
    node.setFormat(s.format);
    node.setIndent(s.indent);
    node.setDirection(s.direction);
    return node;
  }

  createDOM(): HTMLElement {
    return document.createElement("dl");
  }

  updateDOM(): boolean {
    return false;
  }
}

export function $createDefinitionListNode(): DefinitionListNode {
  return $applyNodeReplacement(new DefinitionListNode());
}

export function $isDefinitionListNode(
  node: LexicalNode | null | undefined,
): node is DefinitionListNode {
  return node instanceof DefinitionListNode;
}
