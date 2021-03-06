import { ESTree } from "meriyah";
import { NodeTypes as n } from "@meriyah-utils/types";

/**
 * exports.$exportName = $varName.$exportName;
 */
export function generateExportStatement(varName: string, exportName: string): ESTree.ExpressionStatement {
  return {
    type: n.ExpressionStatement,
    expression: {
      type: n.AssignmentExpression,
      operator: "=" as "=",
      left: {
        type: n.MemberExpression,
        computed: false,
        object: {
          type: n.Identifier,
          name: "exports",
        },
        property: {
          type: n.Identifier,
          name: exportName,
        },
      },
      right: {
        type: n.Identifier,
        name: varName,
      },
    },
  };
}

/**
 * Object.defineProperty(exports, { __esModule: true })
 */
export function generateEsModuleSpecifier() {
  return {
    type: n.ExpressionStatement,
    expression: {
      type: n.CallExpression,
      callee: {
        type: n.MemberExpression,
        computed: false,
        object: {
          type: n.Identifier,
          name: "Object",
        },
        property: {
          type: n.Identifier,
          name: "defineProperty",
        },
      },
      arguments: [
        {
          type: n.Identifier,
          name: "exports",
        },
        {
          type: n.Literal,
          value: "__esModule",
          raw: '"__esModule"',
        },
        {
          type: n.ObjectExpression,
          properties: [
            {
              type: n.Property,
              key: {
                type: n.Identifier,
                name: "value",
              },
              computed: false,
              value: {
                type: n.Literal,
                value: true,
                raw: "true",
              },
              kind: "init" as "init",
              method: false,
              shorthand: false,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Object.defineProperty(exports, $exportName, {
 *   enumerable: true,
 *   configurable: true,
 *   get: function get() {
 *     return $localName;
 *   }
 * })
 */
export function generateExportGetter(
  exportObj:
    | { type: "Identifier"; name: string }
    | { type: "Literal"; value: string },
  local: ESTree.Expression
) {
  return {
    type: n.ExpressionStatement,
    expression: {
      type: n.CallExpression,
      callee: {
        type: n.MemberExpression,
        computed: false,
        object: {
          type: n.Identifier,
          name: "Object",
        },
        property: {
          type: n.Identifier,
          name: "defineProperty",
        },
      },
      arguments: [
        {
          type: n.Identifier,
          name: "exports",
        },
        exportObj,
        {
          type: n.ObjectExpression,
          properties: [
            {
              type: n.Property,
              key: {
                type: n.Identifier,
                name: "enumerable",
              },
              computed: false,
              value: {
                type: n.Literal,
                value: true,
                raw: "true",
              },
              kind: "init" as "init",
              method: false,
              shorthand: false,
            },
            {
              type: n.Property,
              key: {
                type: n.Identifier,
                name: "configurable",
              },
              computed: false,
              value: {
                type: n.Literal,
                value: true,
                raw: "true",
              },
              kind: "init" as "init",
              method: false,
              shorthand: false,
            },
            {
              type: n.Property,
              key: {
                type: n.Identifier,
                name: "get",
              },
              computed: false,
              value: {
                type: n.FunctionExpression,
                id: {
                  type: n.Identifier,
                  name: "$csbGet",
                },
                generator: false,
                async: false,
                params: [],
                body: {
                  type: n.BlockStatement,
                  body: [
                    {
                      type: n.ReturnStatement,
                      argument: local,
                    },
                  ],
                },
              },
              kind: "init" as "init",
              method: false,
              shorthand: false,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Generates:
 * ```js
 * Object.keys($varName).forEach(function (key) {
 *   if (key === "default" || key === "__esModule") return;
 *   if (Object.prototype.hasOwnProperty.call(exports, key)) return;
 *   Object.defineProperty(exports, key, {
 *     enumerable: true,
 *     configurable: true,
 *     get: function get() {
 *       return $varName[key];
 *     }
 *   });
 * });
 * ```
 */
export function generateAllExportsIterator(varName: string) {
  return {
    type: n.ExpressionStatement,
    expression: {
      type: n.CallExpression,
      callee: {
        type: n.MemberExpression,
        computed: false,
        object: {
          type: n.CallExpression,
          callee: {
            type: n.MemberExpression,
            computed: false,
            object: {
              type: n.Identifier,
              name: "Object",
            },
            property: {
              type: n.Identifier,
              name: "keys",
            },
          },
          arguments: [
            {
              type: n.Identifier,
              name: varName,
            },
          ],
        },
        property: {
          type: n.Identifier,
          name: "forEach",
        },
      },
      arguments: [
        {
          type: n.FunctionExpression,
          id: null,
          params: [
            {
              type: n.Identifier,
              name: "key",
            },
          ],
          body: {
            type: n.BlockStatement,
            body: [
              {
                type: n.IfStatement,
                test: {
                  type: n.LogicalExpression,
                  operator: "||" as "||",
                  left: {
                    type: n.BinaryExpression,
                    operator: "===" as "===",
                    left: {
                      type: n.Identifier,
                      name: "key",
                    },
                    right: {
                      type: n.Literal,
                      value: "default",
                      raw: '"default"',
                    },
                  },
                  right: {
                    type: n.BinaryExpression,
                    operator: "===" as "===",
                    left: {
                      type: n.Identifier,
                      name: "key",
                    },
                    right: {
                      type: n.Literal,
                      value: "__esModule",
                      raw: '"__esModule"',
                    },
                  },
                },
                consequent: {
                  type: n.ReturnStatement,
                  argument: null,
                },
                alternate: null,
              },
              {
                type: n.IfStatement,
                test: {
                  type: n.CallExpression,
                  callee: {
                    type: n.MemberExpression,
                    object: {
                      type: n.MemberExpression,
                      object: {
                        type: n.MemberExpression,
                        object: {
                          type: n.Identifier,
                          name: "Object",
                        },
                        computed: false,
                        property: {
                          type: n.Identifier,
                          name: "prototype",
                        },
                      },
                      computed: false,
                      property: {
                        type: n.Identifier,
                        name: "hasOwnProperty",
                      },
                    },
                    computed: false,
                    property: {
                      type: n.Identifier,
                      name: "call",
                    },
                  },
                  arguments: [
                    {
                      type: n.Identifier,
                      name: "exports",
                    },
                    {
                      type: n.Identifier,
                      name: "key",
                    },
                  ],
                },
                consequent: {
                  type: n.ReturnStatement,
                  argument: null,
                },
                alternate: null,
              },
              generateExportGetter(
                { type: n.Identifier, name: "key" },
                {
                  type: n.MemberExpression,
                  computed: true,
                  object: {
                    type: n.Identifier,
                    name: varName,
                  },
                  property: {
                    type: n.Identifier,
                    name: "key",
                  },
                }
              ),
            ],
          },
          generator: false,
          expression: false,
          async: false,
        },
      ],
    },
  };
}
