import * as meriyah from "meriyah";
import { generate as generateCode } from "@meriyah-utils/printer";
import { convertEsModule as convert } from "../src/index";

export function parseModule(code: string): meriyah.ESTree.Program {
  return meriyah.parseModule(code, {
    module: true,
    webcompat: true,
    directives: false,
    next: true,
    raw: true,
    jsx: true,
    loc: false,
    ranges: false,
  });
}

export function convertEsModule(code: string) {
  const ast = parseModule(code);
  convert(ast);
  return generateCode(ast);
}
