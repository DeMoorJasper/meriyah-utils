import { ESTree } from "meriyah";

export function simpleWalk(
  node: any,
  enter: (node: ESTree.Node) => boolean | void
): void {
  if (node && typeof node === "object" && typeof node["type"] === "string") {
    if (!enter(node)) {
      for (let key in node) {
        const value = node[key];
        if (typeof value === "object") {
          if (Array.isArray(value)) {
            for (let item of value) {
              simpleWalk(item, enter);
            }
          } else {
            simpleWalk(value, enter);
          }
        }
      }
    }
  }
}
