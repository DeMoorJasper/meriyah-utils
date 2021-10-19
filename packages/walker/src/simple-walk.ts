import { ESTree } from "meriyah";

export function simpleWalk(
  node: ESTree.Node,
  enter: (node: ESTree.Node, parent: ESTree.Node | null) => boolean | void,
  parent: ESTree.Node | null = null
): void {
  if (node && typeof node === "object" && typeof node["type"] === "string") {
    if (!enter(node, parent)) {
      for (let key in node) {
        const value = node[key];
        if (typeof value === "object") {
          if (Array.isArray(value)) {
            for (let item of value) {
              simpleWalk(item, enter, node);
            }
          } else {
            simpleWalk(value, enter, node);
          }
        }
      }
    }
  }
}
