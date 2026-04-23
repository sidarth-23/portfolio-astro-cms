"use client";
import React from "react";
import { $applyNodeReplacement, type LexicalNode, type NodeKey } from "lexical";
import {
  AbbreviationRegistryServerNode,
  type SerializedAbbreviationRegistryNode,
} from "./AbbreviationRegistryNode.server";

export class AbbreviationRegistryNode extends AbbreviationRegistryServerNode {
  constructor(abbreviations: Record<string, string>, key?: NodeKey) {
    super(abbreviations, key);
  }

  static getType() {
    return super.getType();
  }

  static clone(node: AbbreviationRegistryNode): AbbreviationRegistryNode {
    return new AbbreviationRegistryNode(node.__abbreviations, node.__key);
  }

  static importJSON(serialized: SerializedAbbreviationRegistryNode): AbbreviationRegistryNode {
    return $createAbbreviationRegistryNode(serialized.abbreviations);
  }

  decorate(): React.ReactElement {
    const entries = Object.entries(this.__abbreviations);
    return (
      <div
        contentEditable={false}
        className="my-2 rounded border border-dashed border-gray-300 bg-gray-50 p-3 text-sm"
      >
        <p className="mb-2 font-semibold text-gray-500">Abbreviations</p>
        <table className="w-full table-auto border-collapse text-xs">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 pb-1">Term</th>
              <th className="pb-1">Expansion</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([abbr, expansion]) => (
              <tr key={abbr} className="border-t border-gray-200">
                <td className="pr-4 py-0.5 font-mono font-medium text-gray-700">{abbr}</td>
                <td className="py-0.5 text-gray-600">{expansion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export function $createAbbreviationRegistryNode(
  abbreviations: Record<string, string>,
): AbbreviationRegistryNode {
  return $applyNodeReplacement(new AbbreviationRegistryNode(abbreviations));
}

export function $isAbbreviationRegistryNode(
  node: LexicalNode | null | undefined,
): node is AbbreviationRegistryNode {
  return node instanceof AbbreviationRegistryNode;
}
