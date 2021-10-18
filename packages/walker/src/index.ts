import { SyncHandler, SyncWalker } from "./sync-walker";
import type { ESTree } from "meriyah";

interface SyncWalkHandlers {
  enter: SyncHandler;
  leave: SyncHandler;
}

export function walk(ast: ESTree.Program, { enter, leave }: SyncWalkHandlers) {
  const instance = new SyncWalker(enter, leave);
  return instance.visit(ast, null);
}

export { simpleWalk } from "./simple-walk";
