import type { ESTree } from "meriyah";

import { simpleWalk } from "@meriyah-utils/walker";
import { NodeTypes } from "@meriyah-utils/types";

export function collectDependencies(program: ESTree.Program) {
  const deps: Set<string> = new Set();
  simpleWalk(program, (node) => {
    if (
      node.type === NodeTypes.CallExpression &&
      node.callee.name === "require"
    ) {
      // @ts-ignore
      if (node.arguments.length && node.arguments[0].value) {
        // @ts-ignore
        deps.add(node.arguments[0].value);
      }

      return true;
    }
  });
  return Array.from(deps);
}
