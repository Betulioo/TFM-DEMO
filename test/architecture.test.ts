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

function sourceFiles(dir = "src"): SourceFile[] {
  return readdirSync(join(ROOT, dir), { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".ts"))
    .map((f) => {
      const path = join(dir, f).split("\\").join("/");
      return { path, text: readFileSync(join(ROOT, path), "utf8") };
    });
}

/** Módulos importados (import/export … from, import "x", import("x")), resueltos a ruta del repo si son relativos. */
function imports(file: SourceFile): string[] {
  const pattern = /(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g;
  return [...file.text.matchAll(pattern)].map((m) => {
    const spec = (m[1] ?? m[2])!;
    if (!spec.startsWith(".")) return spec;
    return relative(ROOT, resolve(ROOT, dirname(file.path), spec)).split("\\").join("/");
  });
}

const callsFetch = (f: SourceFile) => /\bfetch\s*\(/.test(f.text);
const isNodeModule = (spec: string) => spec.startsWith("node:") || isBuiltin(spec);

// --- Reglas -------------------------------------------------------------------

/** Imports de una capa que no salen de las carpetas permitidas (los módulos de Node nunca están permitidos). */
function layerViolations(files: SourceFile[], layer: string, allowed: string[]): string[] {
  return files
    .filter((f) => f.path.startsWith(layer))
    .flatMap((f) =>
      imports(f)
        .filter((i) => isNodeModule(i) || !allowed.some((dir) => i.startsWith(dir)))
        .map((i) => `${f.path} importa ${i}`),
    );
}

function domainViolations(files: SourceFile[]): string[] {
  return [
    ...layerViolations(files, "src/domain/", ["src/domain/"]),
    ...files.filter((f) => f.path.startsWith("src/domain/") && callsFetch(f)).map((f) => `${f.path} llama a fetch`),
  ];
}

function portsViolations(files: SourceFile[]): string[] {
  return layerViolations(files, "src/ports/", ["src/domain/", "src/ports/"]);
}

function nonGetViolations(files: SourceFile[]): string[] {
  return files.flatMap((f) => {
    const found: string[] = [];
    if (f.path !== READ_ONLY_CLIENT && callsFetch(f)) found.push(`${f.path} llama a fetch (solo puede ${READ_ONLY_CLIENT})`);
    for (const i of imports(f)) {
      if (/^(node:)?https?$/.test(i)) found.push(`${f.path} importa ${i} (peticiones fuera del cliente de solo lectura)`);
    }
    if (f.path === READ_ONLY_CLIENT) {
      for (const m of f.text.matchAll(/method:\s*["'](\w+)["']/g)) {
        if (m[1] !== "GET") found.push(`${f.path} usa el método ${m[1]}`);
      }
    }
    return found;
  });
}

function scriptsViolations(files: SourceFile[]): string[] {
  return files.flatMap((f) => imports(f).filter((i) => i.startsWith("scripts/")).map((i) => `${f.path} importa ${i}`));
}

// --- Sobre el código real -------------------------------------------------------

const files = sourceFiles();

test("arquitectura: hay archivos que comprobar (incluido el cliente de solo lectura)", () => {
  assert.ok(files.some((f) => f.path.startsWith("src/domain/")));
  assert.ok(files.some((f) => f.path === READ_ONLY_CLIENT));
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
