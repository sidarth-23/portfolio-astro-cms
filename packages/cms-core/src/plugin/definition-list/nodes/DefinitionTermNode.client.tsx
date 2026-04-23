"use client";
import { $applyNodeReplacement, type LexicalNode } from "lexical";
import {
  DefinitionTermServerNode,
  type SerializedDefinitionTermNode,
} from "./DefinitionTermNode.server";

export class DefinitionTermNode extends DefinitionTermServerNode {
  static getType() {
    return super.getType();
  }

  static clone(node: DefinitionTermNode): DefinitionTermNode {
    return new DefinitionTermNode(node.__key);
  }

  static importJSON(s: SerializedDefinitionTermNode): DefinitionTermNode {
    const node = $createDefinitionTermNode();
    node.setFormat(s.format);
    node.setIndent(s.indent);
    node.setDirection(s.direction);
    return node;
  }
}

export function $createDefinitionTermNode(): DefinitionTermNode {
  return $applyNodeReplacement(new DefinitionTermNode());
}

export function $isDefinitionTermNode(
  node: LexicalNode | null | undefined,
): node is DefinitionTermNode {
  return node instanceof DefinitionTermNode;
}
