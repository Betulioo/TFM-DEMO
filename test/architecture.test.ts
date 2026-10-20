// Check de arquitectura: las reglas de "Reglas de arquitectura (comprobadas)" de CLAUDE.md (única fuente),
// comprobadas sobre el código. eslint.config.js comprueba las mismas en `npm run lint`.
// Lee los archivos de src/ como texto (sin dependencias nuevas). Cada regla tiene un test de control con
// código de ejemplo, para que un fallo del propio check no haga pasar los tests sin comprobar nada.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { isBuiltin } from "node:module";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const READ_ONLY_CLIENT = "src/adapters/azdo/read-only-client.ts";

interface SourceFile {
  /** Ruta relativa a la raíz del repo, con `/`. */
  path: string;
  text: string;
}

/** Los tests en carpetas `tests/` de `src/` no son código de ninguna capa: usan `node:test` y `node:assert`. */
const isTestFile = (fileName: string) => fileName.split(/[\\/]/).includes("tests");

function sourceFiles(directory = "src"): SourceFile[] {
  return readdirSync(join(ROOT, directory), { recursive: true, encoding: "utf8" })
    .filter((fileName) => fileName.endsWith(".ts") && !isTestFile(fileName))
    .map((fileName) => {
      const path = join(directory, fileName).split("\\").join("/");
      return { path, text: readFileSync(join(ROOT, path), "utf8") };
    });
}

/** Módulos importados (import/export … from, import "x", import("x")), resueltos a ruta del repo si son relativos. */
function imports(file: SourceFile): string[] {
  const pattern = /(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g;
  return [...file.text.matchAll(pattern)].map((match) => {
    const specifier = (match[1] ?? match[2])!;
    if (!specifier.startsWith(".")) return specifier;
    return relative(ROOT, resolve(ROOT, dirname(file.path), specifier)).split("\\").join("/");
  });
}

const callsFetch = (file: SourceFile) => /\bfetch\s*\(/.test(file.text);
const isNodeModule = (specifier: string) => specifier.startsWith("node:") || isBuiltin(specifier);

// --- Reglas -------------------------------------------------------------------

/** Imports de una capa que no salen de las carpetas permitidas (los módulos de Node nunca están permitidos). */
function layerViolations(files: SourceFile[], layer: string, allowed: string[]): string[] {
  return files
    .filter((file) => file.path.startsWith(layer))
    .flatMap((file) =>
      imports(file)
        .filter((importPath) => isNodeModule(importPath) || !allowed.some((directory) => importPath.startsWith(directory)))
        .map((importPath) => `${file.path} importa ${importPath}`),
    );
}

function domainViolations(files: SourceFile[]): string[] {
  return [
    ...layerViolations(files, "src/domain/", ["src/domain/"]),
    ...files.filter((file) => file.path.startsWith("src/domain/") && callsFetch(file)).map((file) => `${file.path} llama a fetch`),
  ];
}

function portsViolations(files: SourceFile[]): string[] {
  return layerViolations(files, "src/ports/", ["src/domain/", "src/ports/"]);
}

function nonGetViolations(files: SourceFile[]): string[] {
  return files.flatMap((file) => {
    const found: string[] = [];
    if (file.path !== READ_ONLY_CLIENT && callsFetch(file)) found.push(`${file.path} llama a fetch (solo puede ${READ_ONLY_CLIENT})`);
    for (const importPath of imports(file)) {
      if (/^(node:)?https?$/.test(importPath)) found.push(`${file.path} importa ${importPath} (peticiones fuera del cliente de solo lectura)`);
    }
    if (file.path === READ_ONLY_CLIENT) {
      for (const match of file.text.matchAll(/method:\s*["'](\w+)["']/g)) {
        if (match[1] !== "GET") found.push(`${file.path} usa el método ${match[1]}`);
      }
    }
    return found;
  });
}

/** Imports de código de producción que apuntan a una carpeta `tests/` o a los helpers de los tests. */
function testImportViolations(files: SourceFile[]): string[] {
  return files.flatMap((file) =>
    imports(file)
      .filter((importPath) => isTestFile(importPath) || importPath.startsWith("#test-helpers/"))
      .map((importPath) => `${file.path} importa ${importPath}`),
  );
}

function scriptsViolations(files: SourceFile[]): string[] {
  return files.flatMap((file) =>
    imports(file)
      .filter((importPath) => importPath.startsWith("scripts/"))
      .map((importPath) => `${file.path} importa ${importPath}`),
  );
}

const files = sourceFiles();

describe("Arquitectura: el código real cumple las reglas", () => {
  it("hay archivos que comprobar (incluido el cliente de solo lectura)", () => {
    const paths = files.map((file) => file.path);

    const hasDomain = paths.some((path) => path.startsWith("src/domain/"));
    const hasReadOnlyClient = paths.includes(READ_ONLY_CLIENT);

    assert.deepEqual([hasDomain, hasReadOnlyClient], [true, true]);
  });

  it("src/domain solo importa de src/domain, sin node:* ni fetch", () => {
    const violations = domainViolations(files);

    assert.deepEqual(violations, []);
  });

  it("src/ports solo importa de src/domain", () => {
    const violations = portsViolations(files);

    assert.deepEqual(violations, []);
  });

  it("en src/ solo el cliente de solo lectura hace peticiones, y solo GET", () => {
    const violations = nonGetViolations(files);

    assert.deepEqual(violations, []);
  });

  it("src/ no importa nada de scripts/", () => {
    const violations = scriptsViolations(files);

    assert.deepEqual(violations, []);
  });

  it("el código de src/ no importa de carpetas tests/ ni de #test-helpers", () => {
    const violations = testImportViolations(files);

    assert.deepEqual(violations, []);
  });
});

describe("Arquitectura, controles: el check detecta cada violación", () => {
  it("dominio que importa un adaptador, un puerto, node:fs o fs, o llama a fetch", () => {
    const bad: SourceFile = {
      path: "src/domain/malo.ts",
      text: [
        'import { AzdoSource } from "../adapters/azdo/azdo-source.js";',
        'import type { DevOpsSource } from "../ports/devops-source.js";',
        'import { readFileSync } from "node:fs";',
        'import { readFile } from "fs";',
        "await fetch(url);",
      ].join("\n"),
    };

    const violations = domainViolations([bad]);

    assert.equal(violations.length, 5);
  });

  it("un import dentro de domain/ no es violación", () => {
    const good: SourceFile = { path: "src/domain/bueno.ts", text: 'import type { WorkItem } from "./types.js";' };

    const violations = domainViolations([good]);

    assert.deepEqual(violations, []);
  });

  it("un puerto que importa un adaptador o node:*", () => {
    const bad: SourceFile = {
      path: "src/ports/malo.ts",
      text: 'import { AzdoSource } from "../adapters/azdo/azdo-source.js";\nimport { readFileSync } from "node:fs";',
    };

    const violations = portsViolations([bad]);

    assert.equal(violations.length, 2);
  });

  it("fetch fuera del cliente, node:https y métodos que no son GET", () => {
    const outside: SourceFile = { path: "src/adapters/azdo/otro.ts", text: "await fetch(url, { method: \"GET\" });" };
    const https: SourceFile = { path: "src/adapters/azdo/otro2.ts", text: 'import { request } from "node:https";' };
    const post: SourceFile = { path: READ_ONLY_CLIENT, text: 'await fetch(url, { method: "POST" });' };

    const violations = nonGetViolations([outside, https, post]);

    assert.equal(violations.length, 3);
  });

  it("solo se excluyen del check los archivos dentro de una carpeta tests/", () => {
    const fileNames = ["domain/tests/rules.test.ts", "domain/rules.ts", "domain/tests-helpers.ts", "domain/rules.test.ts"];

    const excluded = fileNames.map(isTestFile);

    assert.deepEqual(excluded, [true, false, false, false]);
  });

  it("código de src/ que importa de una carpeta tests/ o de #test-helpers", () => {
    const bad: SourceFile = {
      path: "src/domain/malo.ts",
      text: 'import { buildCase } from "./tests/helpers.js";\nimport { NOW_ISO } from "#test-helpers/test-data.js";',
    };

    const violations = testImportViolations([bad]);

    assert.deepEqual(violations, ["src/domain/malo.ts importa src/domain/tests/helpers.js", "src/domain/malo.ts importa #test-helpers/test-data.js"]);
  });

  it("src/ importando scripts/", () => {
    const bad: SourceFile = { path: "src/adapters/azdo/malo.ts", text: 'import { AzdoWriteClient } from "../../../scripts/lib/write-client.js";' };

    const violations = scriptsViolations([bad]);

    assert.deepEqual(violations, ["src/adapters/azdo/malo.ts importa scripts/lib/write-client.js"]);
  });
});
