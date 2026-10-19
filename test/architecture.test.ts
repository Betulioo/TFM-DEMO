// Check de arquitectura: las reglas de "Reglas de arquitectura (comprobadas)" de CLAUDE.md (única fuente),
// comprobadas sobre el código. eslint.config.js comprueba las mismas en `npm run lint`.
// Lee los archivos de src/ como texto (sin dependencias nuevas). Cada regla tiene un test de control con
// código de ejemplo, para que un fallo del propio check no haga pasar los tests sin comprobar nada.
import { test } from "node:test";
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

function sourceFiles(directory = "src"): SourceFile[] {
  return readdirSync(join(ROOT, directory), { recursive: true, encoding: "utf8" })
    .filter((fileName) => fileName.endsWith(".ts"))
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

function scriptsViolations(files: SourceFile[]): string[] {
  return files.flatMap((file) =>
    imports(file)
      .filter((importPath) => importPath.startsWith("scripts/"))
      .map((importPath) => `${file.path} importa ${importPath}`),
  );
}

// --- Sobre el código real -------------------------------------------------------

const files = sourceFiles();

test("arquitectura: hay archivos que comprobar (incluido el cliente de solo lectura)", () => {
  assert.ok(files.some((file) => file.path.startsWith("src/domain/")));
  assert.ok(files.some((file) => file.path === READ_ONLY_CLIENT));
});

test("arquitectura: src/domain solo importa de src/domain, sin node:* ni fetch", () => {
  assert.deepEqual(domainViolations(files), []);
});

test("arquitectura: src/ports solo importa de src/domain", () => {
  assert.deepEqual(portsViolations(files), []);
});

test("arquitectura: en src/ solo el cliente de solo lectura hace peticiones, y solo GET", () => {
  assert.deepEqual(nonGetViolations(files), []);
});

test("arquitectura: src/ no importa nada de scripts/", () => {
  assert.deepEqual(scriptsViolations(files), []);
});

// --- Controles: el check detecta cada violación ----------------------------------

test("control: detecta dominio que importa un adaptador, un puerto, node:fs o fs, o llama a fetch", () => {
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
  const good: SourceFile = { path: "src/domain/bueno.ts", text: 'import type { WorkItem } from "./types.js";' };

  assert.equal(domainViolations([bad]).length, 5);
  assert.deepEqual(domainViolations([good]), []);
});

test("control: detecta un puerto que importa un adaptador o node:*", () => {
  const bad: SourceFile = {
    path: "src/ports/malo.ts",
    text: 'import { AzdoSource } from "../adapters/azdo/azdo-source.js";\nimport { readFileSync } from "node:fs";',
  };
  assert.equal(portsViolations([bad]).length, 2);
});

test("control: detecta fetch fuera del cliente, node:https y métodos que no son GET", () => {
  const outside: SourceFile = { path: "src/adapters/azdo/otro.ts", text: "await fetch(url, { method: \"GET\" });" };
  const https: SourceFile = { path: "src/adapters/azdo/otro2.ts", text: 'import { request } from "node:https";' };
  const post: SourceFile = { path: READ_ONLY_CLIENT, text: 'await fetch(url, { method: "POST" });' };
  assert.equal(nonGetViolations([outside, https, post]).length, 3);
});

test("control: detecta src/ importando scripts/", () => {
  const bad: SourceFile = { path: "src/adapters/azdo/malo.ts", text: 'import { AzdoWriteClient } from "../../../scripts/lib/write-client.js";' };
  assert.deepEqual(scriptsViolations([bad]), ["src/adapters/azdo/malo.ts importa scripts/lib/write-client.js"]);
});
