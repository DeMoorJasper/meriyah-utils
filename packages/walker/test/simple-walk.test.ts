import { ESTree } from "meriyah";
import { simpleWalk } from "../src/index";

describe("Simple Walk", () => {
  it("walks an AST", () => {
    const ast = {
      type: "Program",
      body: [
        {
          type: "VariableDeclaration",
          declarations: [
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "a" },
              init: { type: "Literal", value: 1, raw: "1" },
            },
            {
              type: "VariableDeclarator",
              id: { type: "Identifier", name: "b" },
              init: { type: "Literal", value: 2, raw: "2" },
            },
          ],
          kind: "var",
          something: {
            type: "ExpressionStatement",
            start: 0,
            end: 6,
            expression: {
              type: "BinaryExpression",
              start: 0,
              end: 5,
              left: {
                type: "Identifier",
                start: 0,
                end: 1,
                name: "a",
              },
              operator: "+",
              right: {
                type: "Identifier",
                start: 4,
                end: 5,
                name: "b",
              },
            },
          },
        },
      ],
      sourceType: "module",
    };

    let entered: ESTree.Node[] = [];

    // @ts-ignore
    simpleWalk(ast, (node) => {
      entered.push(node);
    });

    expect(entered).toEqual([
      ast,
      ast.body[0],
      ast.body[0].declarations[0],
      ast.body[0].declarations[0].id,
      ast.body[0].declarations[0].init,
      ast.body[0].declarations[1],
      ast.body[0].declarations[1].id,
      ast.body[0].declarations[1].init,
      ast.body[0].something,
      ast.body[0].something.expression,
      ast.body[0].something.expression.left,
      ast.body[0].something.expression.right,
    ]);
  });

  it("handles null literals", () => {
    const ast = {
      type: "Program",
      start: 0,
      end: 8,
      body: [
        {
          type: "ExpressionStatement",
          start: 0,
          end: 5,
          expression: {
            type: "Literal",
            start: 0,
            end: 4,
            value: null,
            raw: "null",
          },
        },
        {
          type: "ExpressionStatement",
          start: 6,
          end: 8,
          expression: {
            type: "Literal",
            start: 6,
            end: 7,
            value: 1,
            raw: "1",
          },
        },
      ],
      sourceType: "module",
    };

    let entered: ESTree.Node[] = [];

    // @ts-ignore
    simpleWalk(ast, (node) => {
      entered.push(node);
    });

    expect(entered).toEqual([
      ast,
      ast.body[0],
      ast.body[0].expression,
      ast.body[1],
      ast.body[1].expression,
    ]);
  });

  it("allows opting out of processing child items", () => {
    const ast = {
      type: "Program",
      start: 0,
      end: 8,
      body: [
        {
          type: "ExpressionStatement",
          start: 0,
          end: 6,
          expression: {
            type: "BinaryExpression",
            start: 0,
            end: 5,
            left: {
              type: "Identifier",
              start: 0,
              end: 1,
              name: "a",
            },
            operator: "+",
            right: {
              type: "Identifier",
              start: 4,
              end: 5,
              name: "b",
            },
          },
        },
      ],
      sourceType: "module",
    };

    let entered: ESTree.Node[] = [];

    // @ts-ignore
    simpleWalk(ast, (node) => {
      entered.push(node);
      return node.type === "BinaryExpression";
    });

    expect(entered).toEqual([ast, ast.body[0], ast.body[0].expression]);
  });
});
