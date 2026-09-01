"use client";

import { $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import {
  FootnoteSeparatorServerNode,
  type SerializedFootnoteSeparatorNode,
} from "./FootnoteSeparatorNode.server";

export class FootnoteSeparatorNode extends FootnoteSeparatorServerNode {
  constructor(key?: NodeKey) {
    super(key);
  }

  static getType() {
    return super.getType();
  }

  static clone(node: FootnoteSeparatorNode) {
    return new FootnoteSeparatorNode(node.__key);
  }

  static importJSON(_json: SerializedFootnoteSeparatorNode): FootnoteSeparatorNode {
    return new FootnoteSeparatorNode();
  }

  decorate(): React.ReactElement {
    return (
      <>
        <hr className="LexicalEditorTheme__hr" />
        <h3 className="LexicalEditorTheme__h3">Footnotes</h3>
      </>
    );
  }
}

export function $createFootnoteSeparatorNode(): FootnoteSeparatorNode {
  return $applyNodeReplacement(new FootnoteSeparatorNode());
}

export function $isFootnoteSeparatorNode(
  node: LexicalNode | null | undefined,
): node is FootnoteSeparatorNode {
  return node instanceof FootnoteSeparatorNode;
}
