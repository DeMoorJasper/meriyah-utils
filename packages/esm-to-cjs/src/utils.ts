export function generateVariableName(input: string): string {
  const v = input.replace(/[^A-Za-z0-9]+/g, "_");
  return v.substr(v.length - 36);
}
