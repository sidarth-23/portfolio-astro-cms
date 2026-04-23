"use client";
import { $applyNodeReplacement, type LexicalNode } from "lexical";
import {
  DefinitionDescriptionServerNode,
  type SerializedDefinitionDescriptionNode,
} from "./DefinitionDescriptionNode.server";

export class DefinitionDescriptionNode extends DefinitionDescriptionServerNode {
  static getType() {
    return super.getType();
  }

  static clone(node: DefinitionDescriptionNode): DefinitionDescriptionNode {
    return new DefinitionDescriptionNode(node.__key);
  }

  static importJSON(s: SerializedDefinitionDescriptionNode): DefinitionDescriptionNode {
    const node = $createDefinitionDescriptionNode();
    node.setFormat(s.format);
    node.setIndent(s.indent);
    node.setDirection(s.direction);
    return node;
  }
}

export function $createDefinitionDescriptionNode(): DefinitionDescriptionNode {
  return $applyNodeReplacement(new DefinitionDescriptionNode());
}

export function $isDefinitionDescriptionNode(
  node: LexicalNode | null | undefined,
): node is DefinitionDescriptionNode {
  return node instanceof DefinitionDescriptionNode;
}
