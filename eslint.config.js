// Lint: reglas generales de TypeScript + reglas propias del proyecto (capas hexagonales y solo lectura).
// Las capas están descritas en CLAUDE.md (sección Arquitectura).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** `src/` nunca puede importar `scripts/` (ahí vive el cliente con escritura). */
const NO_SCRIPTS = { group: ["**/scripts/**"], message: "src/ no puede importar scripts/: ahí está el cliente con escritura." };

/** Regla de imports para una capa: siempre prohíbe scripts/ y además los grupos indicados. */
function layer(files, forbidden) {
  return {
    files,
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_SCRIPTS, ...forbidden] }],
    },
  };
}

export default tseslint.config(
  { ignores: ["node_modules/", "dist/", "output/"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ["eslint.config.js"] }, tsconfigRootDir: import.meta.dirname },
    },
  },
  { files: ["eslint.config.js"], ...tseslint.configs.disableTypeChecked },

  // --- Capas (de la más interna a la más externa) ---
  layer(["src/**/*.ts"], []),
  layer(["src/domain/**/*.ts"], [
    { group: ["../*", "!../domain/**"], message: "domain/ no importa nada fuera de domain/." },
    { group: ["node:*"], message: "domain/ no usa APIs de Node: recibe los datos como parámetros." },
  ]),
  layer(["src/ports/**/*.ts"], [
    { group: ["**/adapters/**", "**/application/**", "**/config.js"], message: "ports/ solo importa domain/." },
    { group: ["node:*"], message: "ports/ no usa APIs de Node." },
  ]),
  layer(["src/application/**/*.ts"], [
    { group: ["**/adapters/**", "**/config.js"], message: "application/ usa los puertos, no los adaptadores." },
  ]),

  // node:test gestiona las promesas que devuelve test(): no hace falta esperarlas.
  { files: ["test/**/*.ts"], rules: { "@typescript-eslint/no-floating-promises": "off" } },
  // Los dobles (adaptador falso y lectores de los tests) tienen los datos en memoria: `async` sin `await`
  // es intencionado y se lee mejor que `Promise.resolve(...)`. En el resto, la regla detecta `await` olvidados.
  { files: ["src/adapters/fixtures/**/*.ts", "test/**/*.ts"], rules: { "@typescript-eslint/require-await": "off" } },

  // --- Solo lectura: en src/ solo el cliente de solo lectura habla con la red ---
  {
    files: ["src/**/*.ts"],
    ignores: ["src/adapters/azdo/read-only-client.ts"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: "Usa AzdoReadOnlyClient: es el único que habla con Azure DevOps." }],
    },
  },
);
