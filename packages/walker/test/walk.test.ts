import { walk } from "../src/index";

describe("sync estree-walker", () => {
  it("walks a malformed node", () => {
    const block = [
      {
        type: "Foo",
        answer: undefined,
      },
      {
        type: "Foo",
        answer: {
          type: "Answer",
          value: 42,
        },
      },
    ];

    let answer;
    walk(
      // @ts-ignore
      { type: "Test", block },
      {
        enter(node) {
          // @ts-ignore
          if (node.type === "Answer") {
            answer = node;
          }
        },
      }
    );
    expect(answer).toBe(block[1].answer);
  });

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
        },
      ],
      sourceType: "module",
    };

    let entered = [];
    let left = [];

    // @ts-ignore
    walk(ast, {
      enter(node) {
        entered.push(node);
      },
      leave(node) {
        left.push(node);
      },
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
    ]);

    expect(left).toEqual([
      ast.body[0].declarations[0].id,
      ast.body[0].declarations[0].init,
      ast.body[0].declarations[0],
      ast.body[0].declarations[1].id,
      ast.body[0].declarations[1].init,
      ast.body[0].declarations[1],
      ast.body[0],
      ast,
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

    // @ts-ignore
    walk(ast, {
      enter() {},
      leave() {},
    });

    expect(true).toBeTruthy();
  });

  it("allows walk() to be invoked within a walk, without context corruption", () => {
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

    const identifiers = [];

    // @ts-ignore
    walk(ast, {
      enter(node) {
        if (node.type === "ExpressionStatement") {
          // @ts-ignore
          walk(node, {
            enter() {
              this.skip();
            },
          });
        }

        if (node.type === "Identifier") {
          identifiers.push(node.name);
        }
      },
    });

    expect(identifiers).toEqual(["a", "b"]);
  });

  it("replaces a node", () => {
    const phases = ["enter", "leave"];
    for (const phase of phases) {
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

      const forty_two = {
        type: "Literal",
        value: 42,
        raw: "42",
      };

      // @ts-ignore
      walk(ast, {
        [phase](node) {
          if (node.type === "Identifier" && node.name === "b") {
            this.replace(forty_two);
          }
        },
      });

      expect(ast.body[0].expression.right).toEqual(forty_two);
    }
  });

  it("replaces a top-level node", () => {
    const ast = {
      type: "Identifier",
      name: "answer",
    };

    const forty_two = {
      type: "Literal",
      value: 42,
      raw: "42",
    };

    // @ts-ignore
    const node = walk(ast, {
      enter(node) {
        if (node.type === "Identifier" && node.name === "answer") {
          // @ts-ignore
          this.replace(forty_two);
        }
      },
    });

    expect(node).toEqual(forty_two);
  });

  it("removes a node property", () => {
    const phases = ["enter", "leave"];
    for (const phase of phases) {
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

      // @ts-ignore
      walk(ast, {
        [phase](node) {
          if (node.type === "Identifier" && node.name === "b") {
            this.remove();
          }
        },
      });

      expect(ast.body[0].expression.right).toEqual(undefined);
    }
  });

  it("removes a node from array", () => {
    const phases = ["enter", "leave"];
    for (const phase of phases) {
      const ast = {
        type: "Program",
        body: [
          {
            type: "VariableDeclaration",
            declarations: [
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "a",
                },
                init: null,
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "b",
                },
                init: null,
              },
              {
                type: "VariableDeclarator",
                id: {
                  type: "Identifier",
                  name: "c",
                },
                init: null,
              },
            ],
            kind: "let",
          },
        ],
        sourceType: "module",
      };

      const visitedIndex = [];

      // @ts-ignore
      walk(ast, {
        [phase](node, parent, key, index) {
          if (node.type === "VariableDeclarator") {
            visitedIndex.push(index);
            if (node.id.name === "a" || node.id.name === "b") {
              this.remove();
            }
          }
        },
      });

      expect(ast.body[0].declarations.length).toBe(1);
      expect(visitedIndex.length).toBe(3);
      expect(visitedIndex).toEqual([0, 0, 0]);
      expect(ast.body[0].declarations[0].id.name).toBe("c");
    }
  });
});
