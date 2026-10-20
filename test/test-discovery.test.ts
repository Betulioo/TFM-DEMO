// `npm test` busca los tests con globs de la shell: una carpeta `tests/` a otra profundidad no se ejecutaría y
// nada avisaría. Este test compara los `*.test.ts` del repo con los patrones del script `test` de package.json.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SKIPPED_DIRECTORIES = new Set(["node_modules", ".git", "dist", "output"]);

/** Patrones `*.test.ts` del script `test` de package.json. */
function testScriptPatterns(): string[] {
  const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: { test: string } };
  return packageJson.scripts.test.split(/\s+/).filter((word) => word.endsWith(".test.ts"));
}

/** Glob de la shell a expresión regular: `*` es cualquier texto sin `/`. */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${escaped.join("[^/]*")}$`);
}

function testFilesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.has(entry.name) ? [] : testFilesIn(path);
    return entry.name.endsWith(".test.ts") ? [relative(ROOT, path).split("\\").join("/")] : [];
  });
}

function unmatchedTestFiles(testFiles: string[], patterns: string[]): string[] {
  const expressions = patterns.map(globToRegExp);
  return testFiles.filter((testFile) => !expressions.some((expression) => expression.test(testFile)));
}

describe("npm test encuentra todos los tests", () => {
  it("cada *.test.ts del repo entra en algún patrón del script test", () => {
    const testFiles = testFilesIn(ROOT);

    const unmatched = unmatchedTestFiles(testFiles, testScriptPatterns());

    assert.deepEqual(unmatched, []);
  });

  it("control: detecta un test en una carpeta tests/ a una profundidad sin patrón", () => {
    const testFiles = ["src/domain/tests/rules.test.ts", "src/adapters/azdo/client/tests/client.test.ts"];

    const unmatched = unmatchedTestFiles(testFiles, ["src/*/tests/*.test.ts", "src/*/*/tests/*.test.ts"]);

    assert.deepEqual(unmatched, ["src/adapters/azdo/client/tests/client.test.ts"]);
  });
});
