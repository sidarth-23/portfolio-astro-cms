"use client";
import React from "react";
import { $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import {
  FootnoteReferenceServerNode,
  type SerializedFootnoteReferenceNode,
} from "./FootnoteReferenceNode.server";

export class FootnoteReferenceNode extends FootnoteReferenceServerNode {
  constructor(footnoteId: string, key?: NodeKey) {
    super(footnoteId, key);
  }
  static getType() {
    return super.getType();
  }
  static clone(node: FootnoteReferenceNode) {
    return new FootnoteReferenceNode(node.__footnoteId, node.__key);
  }
  static importJSON(s: SerializedFootnoteReferenceNode): FootnoteReferenceNode {
    return $createFootnoteReferenceNode(s.footnoteId);
  }
  decorate(): React.ReactElement {
    return (
      <sup className="footnote-ref" data-footnote-id={this.__footnoteId}>
        <a href={`#fn-${this.__footnoteId}`} id={`fnref-${this.__footnoteId}`}>
          {this.__footnoteId}
        </a>
      </sup>
    );
  }
}

export function $createFootnoteReferenceNode(footnoteId: string): FootnoteReferenceNode {
  return $applyNodeReplacement(new FootnoteReferenceNode(footnoteId));
}
export function $isFootnoteReferenceNode(
  node: LexicalNode | null | undefined,
): node is FootnoteReferenceNode {
  return node instanceof FootnoteReferenceNode;
}
