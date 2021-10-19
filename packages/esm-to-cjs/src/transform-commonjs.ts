import * as meriyah from "meriyah";
import { simpleWalk } from "@meriyah-utils/walker";
import { NodeTypes as n } from "@meriyah-utils/types";
import * as escope from "escope";

import {
  generateAllExportsIterator,
  generateEsModuleSpecifier,
  generateExportGetter,
  generateExportStatement,
} from "./generate-exports";
import {
  generateInteropRequire,
  generateInteropRequireExpression,
  generateRequireStatement,
} from "./generate-require";
import { generateVariableName } from "./utils";

/**
 * Transforms esmodule code into commonjs code, built to be as fast as possible
 */
export function transformCommonJS(program: meriyah.ESTree.Program) {
  const usedVarNames = {};
  const varsToRename = {};
  const trackedExports = {};

  /**
   * All names we export, used to predefine the exports at the start
   */
  const exportNames = new Set<string>();

  const getVarName = (name: string) => {
    let usedName = name.replace(/(\s|\.|-|@|\?|&|=|{|})/g, "");
    while (usedVarNames[usedName]) {
      usedName += "_";
    }
    usedVarNames[usedName] = true;
    return usedName;
  };

  let i = 0;
  let importOffset = 0;

  function addNodeInImportSpace(
    oldPosition: number,
    node: meriyah.ESTree.Statement
  ) {
    program.body.splice(oldPosition, 1);
    program.body.splice(importOffset, 0, node);
    importOffset++;
  }

  let addedSpecifier = false;
  function addEsModuleSpecifier() {
    if (addedSpecifier) {
      return;
    }
    addedSpecifier = true;

    program.body.unshift(generateEsModuleSpecifier());

    // Make sure imports will stay after this
    importOffset++;

    i++;
  }

  let addedDefaultInterop = false;
  function addDefaultInterop() {
    if (addedDefaultInterop) {
      return;
    }
    addedDefaultInterop = true;

    program.body.push(generateInteropRequire());
  }

  /**
   * Adds the export identifiers (exports.a = exports.b = exports.c = void 0)
   */
  function addExportVoids() {
    const exportNamesArray = [...exportNames];
    while (exportNamesArray.length !== 0) {
      // We need to chunk the exports by 50, otherwise this line will get too long
      // and the visitor will create a Maximum call stack size exceeded error
      const exportNamesToUse = exportNamesArray.splice(0, 50);
      const totalNode = {
        type: n.ExpressionStatement,
        expression: {
          type: n.AssignmentExpression,
          operator: "=",
        },
      };
      let currentNode: Partial<meriyah.ESTree.AssignmentExpression> =
        totalNode.expression;
      while (exportNamesToUse.length > 0) {
        const exportName = exportNamesToUse.pop();
        currentNode.left = {
          type: n.MemberExpression,
          object: {
            type: n.Identifier,
            name: "exports",
          },
          property: {
            type: n.Identifier,
            name: exportName,
          } as meriyah.ESTree.Identifier,
        };
        if (exportNamesToUse.length) {
          // @ts-expect-error This will be filled in in the next loop
          currentNode.right = {
            type: n.AssignmentExpression,
            operator: "=",
          } as Partial<meriyah.ESTree.AssignmentExpression>;
          currentNode =
            currentNode.right as Partial<meriyah.ESTree.AssignmentExpression>;
        } else {
          currentNode.right = {
            type: n.UnaryExpression,
            operator: "void",
            prefix: true,
            argument: {
              type: n.Literal,
              value: 0,
            },
          };
        }
      }

      // @ts-expect-error TS thinks this is a partial type, but by now it's full
      program.body.unshift(totalNode);
    }
  }

  // If there is a declaration of `exports` (`var exports = []`), we need to rename this
  // variable as it's a reserved keyword
  let exportsDefined = false;

  simpleWalk(program, (node, parent) => {
    if (node.type === n.VariableDeclaration) {
      // We don't rename exports vars in functions, only on root level
      if (
        parent &&
        parent.type === n.BlockStatement &&
        exportsDefined === false
      ) {
        return true;
      }
    } else if (node.type === n.VariableDeclarator) {
      const declNode = node as meriyah.ESTree.VariableDeclarator;
      if (declNode.id.type === n.Identifier && declNode.id.name === "exports") {
        exportsDefined = true;
      }
    } else if (node.type === n.Identifier && exportsDefined) {
      if (node.name === "exports") {
        node.name = "__$csb_exports";
      }
    } else if (!exportsDefined && parent != null) {
      // Skip, we don't need to go deeper now
      return true;
    }
  });

  for (; i < program.body.length; i++) {
    const statement = program.body[i];

    if (statement.type === n.ExportAllDeclaration) {
      // Handles "export * from './something';"

      addEsModuleSpecifier();
      const { source, exported } = statement;
      if (typeof source.value !== "string") {
        continue;
      }

      const varName = getVarName(`$csb__${generateVariableName(source.value)}`);
      addNodeInImportSpace(i, generateRequireStatement(varName, source.value));
      if (exported) {
        // export * as test from './test';
        // TO:
        // var $csb___test = require("./test");
        // Object.defineProperty(exports, "test", {
        //   enumerable: true,
        //   configurable: true,
        //   get: function $csbGet() {
        //     return $csb___test;
        //   }
        // });

        exportNames.add(exported.name);
        program.body.splice(
          importOffset++,
          0,
          generateExportGetter(
            { type: n.Literal, value: exported.name },
            { type: n.Identifier, name: varName }
          )
        );
      } else {
        // export * from './test';
        // TO:
        // const _csb = require('./test');
        // Object.keys(_csb).forEach(key => {
        //   if (key === 'default' || key === '__esModule')
        //     return;
        //   exports[key] = _csb[key])
        // }

        program.body.push(generateAllExportsIterator(varName));
      }
    } else if (statement.type === n.ExportNamedDeclaration) {
      // export { a } from './test';
      // TO:
      // const _csb = require('./test');
      // exports.a = _csb.a;

      addEsModuleSpecifier();
      if (statement.source) {
        // export { ... } from ''
        const { source } = statement;
        if (typeof source.value !== "string") {
          continue;
        }
        const varName = getVarName(
          `$csb__${generateVariableName(source.value)}`
        );

        if (
          statement.specifiers.length === 1 &&
          statement.specifiers[0].type === n.ExportSpecifier &&
          statement.specifiers[0].local.name === "default"
        ) {
          // In this case there's a default re-export. So we need to wrap it in a interopRequireDefault to make sure
          // that default is exposed.
          addDefaultInterop();
          addNodeInImportSpace(
            i,
            generateInteropRequireExpression(
              {
                type: n.CallExpression,
                callee: {
                  type: n.Identifier,
                  name: "require",
                },
                arguments: [
                  {
                    type: n.Literal,
                    value: source.value,
                  },
                ],
              },
              varName
            )
          );
        } else {
          addNodeInImportSpace(
            i,
            generateRequireStatement(varName, source.value)
          );
        }

        if (statement.specifiers.length) {
          statement.specifiers.forEach((specifier) => {
            if (specifier.type === n.ExportSpecifier) {
              exportNames.add(specifier.exported.name);
              program.body.splice(
                importOffset++,
                0,
                generateExportGetter(
                  { type: n.Literal, value: specifier.exported.name },
                  {
                    type: n.MemberExpression,
                    object: {
                      type: n.Identifier,
                      name: varName,
                    },
                    property: {
                      type: n.Identifier,
                      name: specifier.local.name,
                    },
                  }
                )
              );
            }

            i++;
          });
        }
      } else if (statement.declaration) {
        // First remove the export statement
        program.body[i] = statement.declaration;

        if (
          statement.declaration.type === n.FunctionDeclaration ||
          statement.declaration.type === n.ClassDeclaration
        ) {
          // export function test() {}

          // @ts-ignore
          const varName = statement.declaration.id.name;
          i++;
          // Add to start of the file, after the defineModule for __esModule. This way this export is already
          // defined before requiring other modules. This is only possible for function exports.
          const positionToInsert =
            statement.declaration.type === n.FunctionDeclaration ? 1 : i;
          program.body.splice(
            positionToInsert,
            0,
            generateExportStatement(varName, varName)
          );
          exportNames.add(varName);
        } else {
          // export const a = {}
          const declaration =
            statement.declaration as meriyah.ESTree.VariableDeclaration;

          const exportStatements: meriyah.ESTree.Statement[] = [];
          for (let node of declaration.declarations) {
            if (node.id.type === n.ObjectPattern) {
              // export const { a } = c;
              for (let property of node.id.properties) {
                if (
                  property.type !== n.Property ||
                  property.value.type !== n.Identifier
                ) {
                  continue;
                }

                exportNames.add(property.value.name);
                trackedExports[property.value.name] = property.value.name;
                exportStatements.push(
                  generateExportStatement(
                    property.value.name,
                    property.value.name
                  )
                );
              }
            } else if (node.id.type === n.Identifier) {
              trackedExports[node.id.name] = node.id.name;

              exportNames.add(node.id.name);
              exportStatements.push(
                generateExportStatement(node.id.name, node.id.name)
              );
            } else if (node.id.type === n.ArrayPattern) {
              // export const [a, b] = c;
              for (let property of node.id.elements) {
                if (property.type !== n.Identifier) {
                  continue;
                }

                exportNames.add(property.name);
                trackedExports[property.name] = property.name;
                exportStatements.push(
                  generateExportStatement(property.name, property.name)
                );
              }
            }
          }

          program.body.splice(i, 1, declaration, ...exportStatements);
        }
      } else if (statement.specifiers) {
        program.body.splice(i, 1);
        i--;
        statement.specifiers.forEach((specifier) => {
          if (specifier.type === n.ExportSpecifier) {
            i++;

            exportNames.add(specifier.exported.name);
            program.body.unshift(
              generateExportGetter(
                { type: n.Literal, value: specifier.exported.name },
                { type: n.Identifier, name: specifier.local.name }
              )
            );
            // Make sure that nothing can get inbetween this
            importOffset++;
          }
        });
      }
    } else if (statement.type === n.ExportDefaultDeclaration) {
      addEsModuleSpecifier();
      // export default function() {}
      // export default class A {}
      const varName = getVarName(`$csb__default`);
      // First remove the export statement
      if (statement.declaration) {
        if (statement.declaration.type === n.FunctionDeclaration) {
          // @ts-ignore
          statement.declaration.type = n.FunctionExpression;
        } else if (statement.declaration.type === n.ClassExpression) {
          // @ts-ignore
          statement.declaration.type = n.ClassDeclaration;
        }
        const newDeclaration =
          statement.declaration as meriyah.ESTree.Expression;

        // Create a var with the export
        if (
          statement.declaration.type === n.ClassDeclaration ||
          statement.declaration.type === n.FunctionExpression
        ) {
          if (!statement.declaration.id) {
            // If the function or class has no name, we give it to it
            statement.declaration.id = {
              type: n.Identifier,
              name: varName,
            };
          }

          program.body[i] =
            statement.declaration as meriyah.ESTree.DeclarationStatement;
          i++;

          program.body.splice(
            i,
            0,
            generateExportStatement(statement.declaration.id.name, "default")
          );
        } else {
          program.body[i] = {
            type: n.VariableDeclaration,
            kind: "var" as "var",

            declarations: [
              {
                type: n.VariableDeclarator,
                id: {
                  type: n.Identifier,
                  name: varName,
                },
                init: newDeclaration,
              },
            ],
          };
          i++;

          program.body.splice(
            i,
            0,
            generateExportStatement(varName, "default")
          );
        }

        if (
          newDeclaration.type === n.ClassDeclaration ||
          newDeclaration.type === n.FunctionExpression
        ) {
          // @ts-ignore
          trackedExports[newDeclaration.id.name] = "default";
        }
      }
    } else if (statement.type === n.ImportDeclaration) {
      // @ts-ignore Wrong typing in lib?
      const source: meriyah.ESTree.Literal = statement.source;

      if (typeof source.value !== "string") {
        continue;
      }
      const varName = getVarName(`$csb__${generateVariableName(source.value)}`);

      addNodeInImportSpace(i, generateRequireStatement(varName, source.value));

      statement.specifiers.reverse().forEach((specifier) => {
        let localName: string;
        let importName: string;

        if (specifier.type === n.ImportSpecifier) {
          // import {Test} from 'test';
          // const _test = require('test');
          // var Test = _test.Test;

          // Mark that we need to rename all references to this variable
          // to the new require statement. This will happen in the second pass.
          varsToRename[specifier.local.name] = [
            varName,
            specifier.imported.name,
          ];

          return;
        }
        i++;

        if (specifier.type === n.ImportDefaultSpecifier) {
          // import Test from 'test';
          // const _test = require('test');
          // var Test = interopRequireDefault(_test).default;
          localName = specifier.local.name;
          importName = "default";
          addDefaultInterop();

          program.body.splice(
            // After the require statement
            importOffset,
            0,
            generateInteropRequireExpression(
              { type: n.Identifier, name: varName },
              localName
            )
          );

          varsToRename[localName] = [localName, "default"];
          importOffset++;
          return;
        }

        if (specifier.type === n.ImportNamespaceSpecifier) {
          // import * as Test from 'test';
          // const _test = require('test');
          // var Test = _test;
          localName = specifier.local.name;
          // @ts-ignore
          importName = null;
        }

        // insert in index 1 instead of 0 to be after the interopRequireDefault
        program.body.splice(importOffset, 0, {
          type: n.VariableDeclaration,
          kind: "var" as "var",
          declarations: [
            {
              type: n.VariableDeclarator,
              id: {
                type: n.Identifier,
                // @ts-ignore
                name: localName,
              },
              // @ts-ignore
              init: importName
                ? {
                    type: n.MemberExpression,
                    computed: false,
                    object: {
                      type: n.Identifier,
                      name: varName,
                    },
                    property: {
                      type: n.Identifier,
                      name: importName,
                    },
                  }
                : {
                    type: n.Identifier,
                    name: varName,
                  },
            },
          ],
        });
        importOffset++;
      });
    }
  }

  // console.log(exportNames);
  if (
    Object.keys(varsToRename).length > 0 ||
    Object.keys(trackedExports).length > 0
  ) {
    // Convert all the object shorthands to not shorthands, needed later when we rename variables so we
    // don't change to the key literals
    simpleWalk(program, (node) => {
      if (node.type === n.Property) {
        const property = node as meriyah.ESTree.Property;
        if (
          property.shorthand &&
          property.value.type !== n.AssignmentPattern // Not a default initializer
        ) {
          property.value = {
            ...property.key,
          };
          property.shorthand = false;
        }
      }
    });

    // A second pass where we rename all references to imports that were marked before.
    const scopeManager = escope.analyze(program, {
      ecmaVersion: 6,
      sourceType: "module",
    });

    scopeManager.acquire(program);
    scopeManager.scopes.forEach((scope) => {
      scope.references.forEach((ref) => {
        // If the variable cannot be resolved, it must be the var that we had
        // just changed.
        if (
          Object.prototype.hasOwnProperty.call(
            varsToRename,
            ref.identifier.name
          ) &&
          ref.resolved === null &&
          !ref.writeExpr &&
          ref.from.type !== "class"
        ) {
          ref.identifier.name = `(0, ${varsToRename[ref.identifier.name].join(
            "."
          )})`;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            trackedExports,
            ref.identifier.name
          ) &&
          ref.isWrite() &&
          ref.resolved === null &&
          !ref.init
        ) {
          const name = trackedExports[ref.identifier.name];
          ref.identifier.name = `exports.${name} = ${ref.identifier.name}`;
        }
      });
    });
    scopeManager.detach();
  }

  addExportVoids();
}
