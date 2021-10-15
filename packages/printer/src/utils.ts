import { ESTree } from "meriyah";

import { State } from "./core";
import { NEEDS_PARENTHESES, OPERATOR_PRECEDENCE } from "./constants";

export function formatSequence(state: State, nodes: Array<ESTree.Node>) {
  // Writes into `state` a sequence of `nodes`.
  const { generator } = state;
  state.write("(");
  if (nodes != null && nodes.length > 0) {
    generator[nodes[0].type](nodes[0], state);
    const { length } = nodes;
    for (let i = 1; i < length; i++) {
      const param = nodes[i];
      state.write(", ");
      generator[param.type](param, state);
    }
  }
  state.write(")");
}

export function expressionNeedsParenthesis(
  state: State,
  node,
  parentNode,
  isRightHand: boolean
) {
  const nodePrecedence = state.expressionsPrecedence[node.type];
  if (nodePrecedence === NEEDS_PARENTHESES) {
    return true;
  }
  const parentNodePrecedence = state.expressionsPrecedence[parentNode.type];
  if (nodePrecedence !== parentNodePrecedence) {
    // Different node types
    return (
      (!isRightHand &&
        nodePrecedence === 15 &&
        parentNodePrecedence === 14 &&
        parentNode.operator === "**") ||
      nodePrecedence < parentNodePrecedence
    );
  }
  if (nodePrecedence !== 13 && nodePrecedence !== 14) {
    // Not a `LogicalExpression` or `BinaryExpression`
    return false;
  }
  if (node.operator === "**" && parentNode.operator === "**") {
    // Exponentiation operator has right-to-left associativity
    return !isRightHand;
  }
  if (isRightHand) {
    // Parenthesis are used if both operators have the same precedence
    return (
      OPERATOR_PRECEDENCE[node.operator] <=
      OPERATOR_PRECEDENCE[parentNode.operator]
    );
  }
  return (
    OPERATOR_PRECEDENCE[node.operator] <
    OPERATOR_PRECEDENCE[parentNode.operator]
  );
}

export function formatExpression(
  state: State,
  node,
  parentNode,
  isRightHand: boolean
) {
  // Writes into `state` the provided `node`, adding parenthesis around if the provided `parentNode` needs it. If `node` is a right-hand argument, the provided `isRightHand` parameter should be `true`.
  const { generator } = state;
  if (expressionNeedsParenthesis(state, node, parentNode, isRightHand)) {
    state.write("(");
    generator[node.type](node, state);
    state.write(")");
  } else {
    generator[node.type](node, state);
  }
}

export function reindent(
  state: State,
  text: string,
  indent: string,
  lineEnd: string
) {
  // Writes into `state` the `text` string reindented with the provided `indent`.
  const lines = text.split("\n");
  const end = lines.length - 1;
  state.write(lines[0].trim());
  if (end > 0) {
    state.write(lineEnd);
    for (let i = 1; i < end; i++) {
      state.write(indent + lines[i].trim() + lineEnd);
    }
    state.write(indent + lines[end].trim());
  }
}

export function formatComments(
  state: State,
  comments,
  indent: string,
  lineEnd: string
) {
  /*
    Writes into `state` the provided list of `comments`, with the given `indent` and `lineEnd` strings.
    Line comments will end with `"\n"` regardless of the value of `lineEnd`.
    Expects to start on a new unindented line.
  */
  const { length } = comments;
  for (let i = 0; i < length; i++) {
    const comment = comments[i];
    state.write(indent);
    if (comment.type[0] === "L") {
      // Line comment
      state.write("// " + comment.value.trim() + "\n");
    } else {
      // Block comment
      state.write("/*");
      reindent(state, comment.value, indent, lineEnd);
      state.write("*/" + lineEnd);
    }
  }
}

export function hasCallExpression(node) {
  // Returns `true` if the provided `node` contains a call expression and `false` otherwise.
  let currentNode = node;
  while (currentNode != null) {
    const { type } = currentNode;
    if (type[0] === "C" && type[1] === "a") {
      // Is CallExpression
      return true;
    } else if (type[0] === "M" && type[1] === "e" && type[2] === "m") {
      // Is MemberExpression
      currentNode = currentNode.object;
    } else {
      return false;
    }
  }
}

export function formatVariableDeclaration(state, node) {
  // Writes into `state` a variable declaration.
  const { generator } = state;
  const { declarations } = node;
  state.write(node.kind + " ");
  const { length } = declarations;
  if (length > 0) {
    generator.VariableDeclarator(declarations[0], state);
    for (let i = 1; i < length; i++) {
      state.write(", ");
      generator.VariableDeclarator(declarations[i], state);
    }
  }
}
