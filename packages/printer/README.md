# Meriyah Printer

Tiny and fast JavaScript code generator that is compatible with all browser-supported nodes meriyah produces, fork of the `astring` library.

## Usage

```JS
import * as meriyah from 'meriyah';
import { generate } from '@meriyah-utils/printer';

const ast = meriyah.parseModule(code, {
  module: true,
  webcompat: true,
  directives: true,
  next: true,
  raw: true,
  jsx: true,
});

const code = generate(ast);
```
