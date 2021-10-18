import { WalkerBase, WalkerContext } from "./walker";
import type { ESTree } from "meriyah";

export type SyncHandler = (
  this: WalkerContext,
  node: ESTree.Node,
  parent: ESTree.Node,
  key: string,
  index: number
) => void;

export class SyncWalker extends WalkerBase {
  enter: SyncHandler;
  leave: SyncHandler;

  constructor(enter: SyncHandler, leave: SyncHandler) {
    super();
    this.enter = enter;
    this.leave = leave;
  }

  visit(
    node: ESTree.Node,
    parent: ESTree.Node | null,
    prop?: string,
    index?: number
  ) {
    if (node) {
      if (this.enter) {
        const _should_skip = this.should_skip;
        const _should_remove = this.should_remove;
        const _replacement = this.replacement;
        this.should_skip = false;
        this.should_remove = false;
        this.replacement = null;

        this.enter.call(this.context, node, parent, prop, index);

        if (this.replacement) {
          node = this.replacement;
          this.replace(parent, prop, index, node);
        }

        if (this.should_remove) {
          this.remove(parent, prop, index);
        }

        const skipped = this.should_skip;
        const removed = this.should_remove;

        this.should_skip = _should_skip;
        this.should_remove = _should_remove;
        this.replacement = _replacement;

        if (skipped) return node;
        if (removed) return null;
      }

      for (const key in node) {
        const value = node[key];

        if (typeof value !== "object") {
          continue;
        } else if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i += 1) {
            if (value[i] !== null && typeof value[i].type === "string") {
              if (!this.visit(value[i], node, key, i)) {
                // removed
                i--;
              }
            }
          }
        } else if (value !== null && typeof value.type === "string") {
          this.visit(value, node, key, null);
        }
      }

      if (this.leave) {
        const _replacement = this.replacement;
        const _should_remove = this.should_remove;
        this.replacement = null;
        this.should_remove = false;

        this.leave.call(this.context, node, parent, prop, index);

        if (this.replacement) {
          node = this.replacement;
          this.replace(parent, prop, index, node);
        }

        if (this.should_remove) {
          this.remove(parent, prop, index);
        }

        const removed = this.should_remove;

        this.replacement = _replacement;
        this.should_remove = _should_remove;

        if (removed) return null;
      }
    }

    return node;
  }
}
