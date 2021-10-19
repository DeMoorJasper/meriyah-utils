const { generate } = require("@meriyah-utils/printer");
const meriyah = require("meriyah");
const { convertEsModule } = require("..");
const fs = require("fs");
const path = require("path");

function parseModule(code) {
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

// Runs the benchmark and returns the timing for a certain code string
function runTest(code, times = 20) {
  const ast = parseModule(code);
  const timings = [];
  for (let i = 0; i < times; i++) {
    const startTime = Date.now();
    convertEsModule(ast);
    timings.push(Date.now() - startTime);
  }
  return timings;
}

const code = fs.readFileSync(path.join(__dirname, "framer.js"), "utf-8");
const timings = runTest(code);

for (let i = 0; i < timings.length; i++) {
  const timing = timings[i];
  console.log(`Conversion ${i} took: ${timing}ms`);
}
