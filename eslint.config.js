// Lint: reglas generales de TypeScript + reglas propias del proyecto (capas hexagonales y solo lectura).
// Las reglas de capas vienen de CLAUDE.md, "Reglas de arquitectura (comprobadas)" (única fuente);
// test/architecture.test.ts comprueba las mismas.
import eslintJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** `src/` nunca puede importar `scripts/` (ahí vive el cliente con escritura). */
const NO_SCRIPTS = { group: ["**/scripts/**"], message: "src/ no puede importar scripts/: ahí está el cliente con escritura." };

/** Solo el cliente de solo lectura habla con la red, y lo hace con fetch: nada de node:http(s). */
const NO_HTTP = { group: ["node:http", "node:https", "http", "https"], message: "Las peticiones solo las hace AzdoReadOnlyClient (fetch, solo GET)." };

/** Regla de imports para una capa: siempre prohíbe scripts/ y node:http(s), y además los grupos indicados. */
function layer(files, forbidden) {
  return {
    files,
    rules: {
      "no-restricted-imports": ["error", { patterns: [NO_SCRIPTS, NO_HTTP, ...forbidden] }],
    },
  };
}

export default tseslint.config(
  { ignores: ["node_modules/", "dist/", "output/"] },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: { allowDefaultProject: ["eslint.config.js"] }, tsconfigRootDir: import.meta.dirname },
    },
  },
  { files: ["eslint.config.js"], ...tseslint.configs.disableTypeChecked },

  // --- Nombres legibles (CLAUDE.md, "Código limpio") ---
  {
    rules: {
      // properties "never": los campos que impone la API externa se dejan como vienen.
      "id-length": ["error", { min: 3, exceptions: ["id", "i"], properties: "never" }],
      // Abreviaturas de 3+ letras que id-length no detecta.
      "id-denylist": ["error", "prs", "ctx", "deps", "opts", "res", "req", "cfg", "tmp", "val", "obj", "arr", "str", "num", "idx", "cb"],
    },
  },

  // --- Capas (de la más interna a la más externa) ---
  layer(["src/**/*.ts"], []),
  layer(["src/domain/**/*.ts"], [
    // regex y no group: con group, "!../domain/**" no reincluye nada tras excluir "../*" (igual que .gitignore).
    { regex: "^\\.\\./(?!domain/)", message: "domain/ no importa nada fuera de domain/." },
    { group: ["node:*"], message: "domain/ no usa APIs de Node: recibe los datos como parámetros." },
  ]),
  layer(["src/ports/**/*.ts"], [
    { regex: "^\\.\\./(?!domain/|ports/)", message: "ports/ solo importa domain/." },
    { group: ["node:*"], message: "ports/ no usa APIs de Node." },
  ]),
  layer(["src/application/**/*.ts"], [
    { group: ["**/adapters/**", "**/config.js"], message: "application/ usa los puertos, no los adaptadores." },
  ]),

  // node:test gestiona las promesas que devuelve test(): no hace falta esperarlas.
  { files: ["test/**/*.ts"], rules: { "@typescript-eslint/no-floating-promises": "off" } },
  // Un test que lee la hora real pasa hoy y falla mañana (skill tests-semanticos, criterio 3).
  {
    files: ["test/**/*.ts"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "NewExpression[callee.name='Date'][arguments.length=0]",
        message: "Fecha fija en tests: usa NOW o una fecha ISO literal.",
      }],
    },
  },
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
