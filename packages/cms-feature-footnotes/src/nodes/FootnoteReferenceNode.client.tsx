"use client";
import React from "react";
import { $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import {
  FootnoteReferenceServerNode,
  type SerializedFootnoteReferenceNode,
} from "./FootnoteReferenceNode.server";

export class FootnoteReferenceNode extends FootnoteReferenceServerNode {
  constructor(
    footnoteId: string,
    key?: NodeKey,
    displayIndex: null | number = null,
    referenceCount = 1,
  ) {
    super(footnoteId, key, displayIndex, referenceCount);
  }
  static getType() {
    return super.getType();
  }
  static clone(node: FootnoteReferenceNode) {
    return new FootnoteReferenceNode(
      node.__footnoteId,
      node.__key,
      node.__displayIndex,
      node.__referenceCount,
    );
  }
  static importJSON(s: SerializedFootnoteReferenceNode): FootnoteReferenceNode {
    return $createFootnoteReferenceNode(s.footnoteId);
  }
  decorate(): React.ReactElement {
    const encodedId = encodeURIComponent(this.__footnoteId);
    const label = this.__displayIndex === null ? this.__footnoteId : String(this.__displayIndex);
    const anchorId = `fnref-${encodedId}-${this.__referenceCount}`;

    return (
      <sup className="footnote-ref" data-footnote-id={this.__footnoteId}>
        <a data-footnote-id={this.__footnoteId} href={`#fn-${encodedId}`} id={anchorId}>
          {label}
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
