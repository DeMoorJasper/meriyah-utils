import fs from "fs";
import path from "path";
import * as meriyah from "meriyah";
import * as globby from "globby";

import { generate } from "../src/index";

function testFixture(filepath: string, skipInvalid: boolean = false) {
  const input = fs.readFileSync(filepath, "utf-8");
  let inputAST;
  try {
    inputAST = meriyah.parseModule(input, {
      module: true,
      webcompat: true,
      directives: false,
      next: true,
      raw: true,
      jsx: true,
      loc: false,
      ranges: false,
    });
  } catch (err) {
    if (skipInvalid) return;
    throw err;
  }

  const output = generate(inputAST);
  const outputAST = meriyah.parseModule(output, {
    module: true,
    webcompat: true,
    directives: false,
    next: true,
    raw: true,
    jsx: true,
    loc: false,
    ranges: false,
  });

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

describe("test262-parser-tests", () => {
  // We don't support encoded variable names yet
  const ENCODED_VARIABLE_NAMES = new Set([
    "596746323492fbfd.js",
    "5c3d125ce5f032aa.js",
    "c85fbdb8c97e0534.js",
    "dafb7abe5b9b44f5.js",
    "eaee2c64dfc46b6a.js",
    "f5b89028dfa29f27.js",
    "f7f611e6fdb5b9fc.js",
  ]);
  const TEST_262_MODULE_DIR = path.dirname(
    require.resolve("test262-parser-tests/package.json")
  );
  const TEST_262_DIR = path.join(TEST_262_MODULE_DIR, "pass");
  const fixtures = globby
    .sync("**.js", {
      cwd: TEST_262_DIR,
    })
    .filter((f) => !ENCODED_VARIABLE_NAMES.has(f));

  for (let fixture of fixtures) {
    it(`test262: ${fixture}`, () => {
      const filepath = path.join(TEST_262_DIR, fixture);
      testFixture(filepath, true);
    });
  }
});
