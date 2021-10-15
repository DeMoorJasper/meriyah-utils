import type { ESTree } from "meriyah";

import type {
  ExpressionPrecedenceType,
  IOptions,
  CodeGeneratorType,
} from "./types";
import { EXPRESSIONS_PRECEDENCE } from "./constants";
import { GENERATOR } from "./generator";

export class State {
  output: string = "";
  generator: CodeGeneratorType;
  expressionsPrecedence: ExpressionPrecedenceType;
  indent: string;
  lineEnd: string;
  indentLevel: number;
  writeComments: boolean;

  constructor(options: IOptions = {}) {
    this.generator = options.generator != null ? options.generator : GENERATOR;
    this.expressionsPrecedence =
      options.expressionsPrecedence != null
        ? options.expressionsPrecedence
        : EXPRESSIONS_PRECEDENCE;
    // Formating setup
    this.indent = options.indent != null ? options.indent : "  ";
    this.lineEnd = options.lineEnd != null ? options.lineEnd : "\n";
    this.indentLevel =
      options.startingIndentLevel != null ? options.startingIndentLevel : 0;
    this.writeComments = options.comments ? options.comments : false;
  }

  write(code) {
    this.output += code;
  }
}

export function generate(node: ESTree.Program, options?: IOptions) {
  /*
    Returns a string representing the rendered code of the provided AST `node`.
    The `options` are:
  
    - `indent`: string to use for indentation (defaults to `␣␣`)
    - `lineEnd`: string to use for line endings (defaults to `\n`)
    - `startingIndentLevel`: indent level to start from (defaults to `0`)
    - `comments`: generate comments if `true` (defaults to `false`)
    - `output`: output stream to write the rendered code to (defaults to `null`)
    - `generator`: custom code generator (defaults to `GENERATOR`)
    - `expressionsPrecedence`: custom map of node types and their precedence level (defaults to `EXPRESSIONS_PRECEDENCE`)
    */
  const state = new State(options);
  // Travel through the AST node and generate the code
  state.generator[node.type](node, state);
  return state.output;
}
