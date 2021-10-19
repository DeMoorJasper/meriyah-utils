import { ESTree } from "meriyah";

export function simpleWalk(
  node: ESTree.Node,
  callback: (node: ESTree.Node, parent: ESTree.Node | null) => boolean | void,
  parent: ESTree.Node | null = null
): void {
  // Check if node is a valid
  if (node && typeof node === "object" && typeof node["type"] === "string") {
    // call the callback, if it returns true, we skip processing it's children
    if (!callback(node, parent)) {
      for (const key in node) {
        const value = node[key];
        if (typeof value !== "object") {
          continue;
        } else if (Array.isArray(value)) {
          for (let item of value) {
            simpleWalk(item, callback, node);
          }
        } else if (value !== null && typeof value.type === "string") {
          simpleWalk(value, callback, node);
        }
      }
    }
  }
}
