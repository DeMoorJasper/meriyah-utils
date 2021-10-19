import * as meriyah from "meriyah";
import { transformCommonJS } from "./transform-commonjs";

export function convertEsModule(program: meriyah.ESTree.Program): void {
  transformCommonJS(program);
}
