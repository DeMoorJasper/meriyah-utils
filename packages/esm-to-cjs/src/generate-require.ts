import { ESTree } from "meriyah";
import { NodeTypes as n } from "@meriyah-utils/types";

/**
 * Generates `var $varName = require('$requirePath');
 */
export function generateRequireStatement(varName: string, requirePath: string) {
  return {
    type: n.VariableDeclaration,
    declarations: [
      {
        type: n.VariableDeclarator,
        id: {
          type: n.Identifier,
          name: varName,
        },
        init: {
          type: n.CallExpression,
          callee: {
            type: n.Identifier,
            name: "require",
          },
          arguments: [
            {
              type: n.Literal,
              value: requirePath,
            },
          ],
        },
      },
    ],
    kind: "var" as "var",
  };
}

export function generateInteropRequire() {
  return {
    type: n.FunctionDeclaration,
    params: [
      {
        type: n.Identifier,
        name: "obj" as "obj",
      },
    ],
    body: {
      type: n.BlockStatement,
      body: [
        {
          type: n.ReturnStatement,
          argument: {
            type: n.ConditionalExpression,
            test: {
              type: n.LogicalExpression,
              left: {
                type: n.Identifier,
                name: "obj",
              },
              right: {
                type: n.MemberExpression,
                object: {
                  type: n.Identifier,
                  name: "obj",
                },
                computed: false,
                property: {
                  type: n.Identifier,
                  name: "__esModule",
                },
              },
              operator: "&&",
            },
            consequent: {
              type: n.Identifier,
              name: "obj",
            },
            alternate: {
              type: n.ObjectExpression,
              properties: [
                {
                  type: n.Property,
                  key: {
                    type: n.Identifier,
                    name: "default",
                  },
                  value: {
                    type: n.Identifier,
                    name: "obj",
                  },
                  kind: "init" as "init",
                  computed: false,
                  method: false,
                  shorthand: false,
                },
              ],
            },
          },
        },
      ],
    },
    async: false,
    generator: false,
    id: {
      type: n.Identifier,
      name: "$_csb__interopRequireDefault",
    },
  };
}

export function generateInteropRequireExpression(
  argument: ESTree.Expression,
  localName: string
) {
  return {
    type: n.VariableDeclaration,
    kind: "var" as "var",
    declarations: [
      {
        type: n.VariableDeclarator,
        init: {
          type: n.CallExpression,
          callee: {
            type: n.Identifier,
            name: "$_csb__interopRequireDefault",
          },
          arguments: [argument],
        },
        id: {
          type: n.Identifier,
          name: localName,
        },
      },
    ],
  };
}
