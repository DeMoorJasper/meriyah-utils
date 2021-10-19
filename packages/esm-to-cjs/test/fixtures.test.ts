import fs from "fs";
import path from "path";
import * as globby from "globby";
import { convertEsModule } from "./test-utils";

describe("Fixtures", () => {
  const FIXTURES_DIR = path.join(__dirname, "fixtures");
  const fixtures = globby.sync("**.js", {
    cwd: FIXTURES_DIR,
  });

  for (let fixture of fixtures) {
    it(`fixture: ${fixture}`, () => {
      const filepath = path.join(FIXTURES_DIR, fixture);
      const code = fs.readFileSync(filepath, "utf-8");
      const result = convertEsModule(code);
      expect(result).toMatchSnapshot();
    });
  }
});
