import React__default from "react";
import { typefaceAliases } from "./fonts.js";

export class LocalFontSource {
  React_default;
  typefaceAliases;

  constructor() {
    this.typefaceAliases = new Map();
    this.React_default = "react";
  }

  test() {
    this.React_default = "another-react";

    typefaceAliases();

    return this.typefaceAliases;
  }
}
