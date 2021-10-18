import fs from "fs";
import path from "path";
import * as meriyah from "meriyah";
import * as globby from "globby";

import { generate } from "../src/index";

function parseCode(code: string): meriyah.ESTree.Program {
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

function testFixture(filepath: string, skipInvalid: boolean = false) {
  const input = fs.readFileSync(filepath, "utf-8");
  let inputAST;
  try {
    inputAST = parseCode(input);
  } catch (err) {
    if (skipInvalid) return;
    throw err;
  }

  const output = generate(inputAST);
  const outputAST = parseCode(output);

  try {
    expect(outputAST).toEqual(inputAST);
  } catch (err) {
    console.error("=== INPUT ===\n" + input + "\n\n=== OUTPUT ===\n" + output);
    throw err;
  }
}

describe("Fixtures", () => {
  const FIXTURES_DIR = path.join(__dirname, "fixtures");
  const fixtures = globby.sync("**.js", {
    cwd: FIXTURES_DIR,
  });

  for (let fixture of fixtures) {
    it(`Fixtures: ${fixture}`, () => {
      const filepath = path.join(FIXTURES_DIR, fixture);
      testFixture(filepath);
    });
  }
});

describe("Printer transforms", () => {
  const TRANSFORM_FIXTURES = path.join(__dirname, "transforms");

  // Safari does not support private class properties yet
  it("Should transform private class properties and functions into regular class properties", () => {
    const filepath = path.join(TRANSFORM_FIXTURES, "private-class-props.js");
    const code = fs.readFileSync(filepath, "utf-8");
    const program = parseCode(code);
    const output = generate(program);
    expect(output).toMatchSnapshot();
  });
});

// describe("test262-parser-tests", () => {
//   // We don't support encoded variable names yet
//   const ENCODED_VARIABLE_NAMES = new Set([
//     "596746323492fbfd.js",
//     "5c3d125ce5f032aa.js",
//     "c85fbdb8c97e0534.js",
//     "dafb7abe5b9b44f5.js",
//     "eaee2c64dfc46b6a.js",
//     "f5b89028dfa29f27.js",
//     "f7f611e6fdb5b9fc.js",
//   ]);
//   const TEST_262_MODULE_DIR = path.dirname(
//     require.resolve("test262-parser-tests/package.json")
//   );
//   const TEST_262_DIR = path.join(TEST_262_MODULE_DIR, "pass");
//   const fixtures = globby
//     .sync("**.js", {
//       cwd: TEST_262_DIR,
//     })
//     .filter((f) => !ENCODED_VARIABLE_NAMES.has(f));

//   for (let fixture of fixtures) {
//     it(`test262: ${fixture}`, () => {
//       const filepath = path.join(TEST_262_DIR, fixture);
//       testFixture(filepath, true);
//     });
//   }
// });
