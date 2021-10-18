import type { ESTree } from "meriyah";

export interface WalkerContext {
  skip: () => void;
  remove: () => void;
  replace: (node: ESTree.Node) => void;
}

export class WalkerBase {
  should_skip: boolean;
  should_remove: boolean;
  replacement: ESTree.Node | null;
  context: WalkerContext;

  constructor() {
    this.should_skip = false;
    this.should_remove = false;
    this.replacement = null;
    this.context = {
      skip: () => (this.should_skip = true),
      remove: () => (this.should_remove = true),
      replace: (node) => (this.replacement = node),
    };
  }

  replace(parent: any, prop: string, index: number | null | undefined, node: ESTree.Node) {
    if (parent) {
      if (index != null) {
        parent[prop][index] = node;
      } else {
        parent[prop] = node;
      }
    }
  }

  remove(parent: any, prop: string, index: number | null | undefined) {
    if (parent) {
      if (index != null) {
        parent[prop].splice(index, 1);
      } else {
        delete parent[prop];
      }
    }
  }
}
