# Meriyah AST Walker

Based on `estree-walker` by Rich Harris. On top of this library this one adds additional types of walkers for various use-cases.

It also aims to provide more reliable typings

## Usage

```js
import * as meriyah from "meriyah";
import { walk } from "@meriyah-utils/walker";

const ast = meriyah.parseModule(code, {
  module: true,
  webcompat: true,
  directives: true,
  next: true,
  raw: true,
  jsx: true,
});

walk(ast, {
  enter(node, parent, prop, index) {
    // some code happens
  },
  leave(node, parent, prop, index) {
    // some code happens
  },
});
```
