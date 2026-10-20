---
name: testing
description: Convenciones para escribir y revisar tests de este proyecto (node:test + assert/strict, sin red ni tokens) — reglas del dominio, adaptador real con lector falso, adaptador falso desde expected.json y salvaguardas del seed. Úsala al añadir o cambiar código en src/ o scripts/, al escribir tests nuevos o cuando se pida "testear" algo.
---

# Tests del proyecto

Los tests son la comprobación de que la recogida es determinista y correcta **sin depender de la API real**.
Antes de escribir uno, lee `docs/glosario.md` (definiciones) y el caso en `fixtures/expected.json` si aplica.

## Reglas comunes (todas obligatorias)

- **Herramientas:** `node:test` (`test`) y `node:assert/strict`. Nada de Jest ni dependencias nuevas.
- **Ubicación:** `test/<módulo>.test.ts`, en plano. `npm test` ejecuta `test/*.test.ts`.
- **Sin red, sin `.env`, sin tokens.** Ningún test crea `AzdoReadOnlyClient` ni `AzdoWriteClient`: se les pasa
  un doble que implementa la interfaz real (`AzdoReader`, `SeedClient`, `DevOpsSource`). Así, si la interfaz
  cambia, el test deja de compilar.
- **Fechas fijas:** `const NOW = new Date("2026-10-19T09:00:00Z")` y fechas ISO literales. Nunca `new Date()`
  sin argumento dentro de un test.
- **Nombres en español y con los términos del glosario tal cual:** `"mis tareas: sin asignar no cuenta"`,
  `"PR por ID: devuelve undefined si no existe (404)"`. El nombre dice la regla, no la implementación.
- **Comparar IDs o claves de caso, no objetos enteros**, salvo en los tests de traducción API → dominio, donde
  sí se compara el objeto completo con `assert.deepEqual`.
- **Casos A–O:** salen de `fixtures/expected.json`. No copies la lista de casos en un test.
- **Datos explícitos y mínimos:** cada test construye solo lo que importa para su regla con un helper local
  (`buildWorkItem(...)`, `buildApiPullRequest(...)`, `buildApiWorkItem(...)`). Si un helper se usa en 2+ archivos, muévelo a `test/helpers/`.
- **Antes de dar el trabajo por terminado:** `npm run typecheck`, `npm run lint` y `npm test` en verde.

## 1. Dominio (`src/domain/rules.ts`)

Funciones puras: sin dobles, sin `async`, datos explícitos. Si la regla depende del tiempo o de un umbral,
recibe `now` y el umbral como parámetros; el test los fija.

```typescript
const CURRENT_USER = { id: "me", displayName: "Yo" };

function buildWorkItem(id: number, stateCategory: StateCategory, assignedTo = CURRENT_USER, type = "Task"): WorkItem {
  return { id, title: `WI ${id}`, type, state: "x", stateCategory, assignedTo, changedAt: "2026-10-19T00:00:00Z", pullRequestIds: [] };
}

const ids = (workItems: WorkItem[]) => workItems.map((workItem) => workItem.id);

test("mis tareas: el tipo no filtra (procesos personalizados)", () => {
  const workItems = [buildWorkItem(8, "InProgress", CURRENT_USER, "Bug desarrollo"), buildWorkItem(9, "InProgress", CURRENT_USER, "Epic")];

  assert.deepEqual(ids(myTasks(workItems, CURRENT_USER)), [8, 9]);
});
```

Cubre cada fila de la definición del glosario y su límite (p. ej. "3 días o más": 2, 3 y 4 días).

## 2. Adaptador real (`src/adapters/azdo/`) con lector falso

Se prueba **qué pide** (ruta y parámetros) y **cómo traduce** la respuesta al dominio. El lector falso
implementa `AzdoReader` (solo `get`: si el adaptador intentara escribir, no compilaría) y guarda las llamadas.

```typescript
function fakeReader(respond: (call: Call) => unknown): { reader: AzdoReader; calls: Call[] } {
  const calls: Call[] = [];
  const reader: AzdoReader = {
    async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
      const call = { path, params };
      calls.push(call);
      if (path === "_apis/connectionData") return { authenticatedUser: { id: "me-id", providerDisplayName: "Yo" } } as T;
      return respond(call) as T;
    },
  };
  return { reader, calls };
}

test("mis PRs: filtra por creador", async () => {
  const { reader, calls } = fakeReader(() => ({ value: [] }));

  await new AzdoSource(reader, "TFM Demo").myPullRequests();

  assert.equal(calls.at(-1)?.params["searchCriteria.creatorId"], "me-id");
});
```

- **Respuestas con la forma real de la API**, la comprobada contra la demo y anotada en la bitácora (p. ej. el
  enlace a PR con `%2f` en minúscula, `workItemRelations[].target.id`). Si no la has comprobado, dilo; no la inventes.
- **Errores:** `AzdoHttpError` 404 → `undefined` donde el puerto lo diga; el resto se propaga
  (`assert.rejects(..., AzdoHttpError)`). Un dato que no se puede interpretar es un error explícito.
- **Paginación y lotes:** genera justo por encima del límite (101 PRs, 201 work items) y comprueba las llamadas.

### Datos de la API frente a datos de dominio

Los datos de entrada del adaptador se escriben con los tipos de la API (`ApiPullRequest`, `ApiWorkItem`), y lo
esperado, con los tipos de dominio (`PullRequest`, `WorkItem`). No mezcles los dos:

```typescript
// ❌ MAL: un WorkItem de dominio disfrazado de respuesta de la API
const apiWorkItem = { ...buildWorkItem(10, "InProgress"), fields: {} } as unknown as ApiWorkItem;

// ✅ BIEN: respuesta de la API explícita y tipada
function buildApiWorkItem(id: number, type: string, state: string, overrides: Partial<ApiWorkItem> = {}): ApiWorkItem {
  return {
    id,
    fields: { "System.Title": `WI ${id}`, "System.WorkItemType": type, "System.State": state, "System.ChangedDate": "2026-10-19T13:49:41Z" },
    ...overrides,
  };
}
```

## 3. Adaptador falso (`src/adapters/fixtures/`)

Genera los datos desde `fixtures/expected.json` con fechas relativas a `NOW`. Sus tests comprueban que cada
caso acaba donde dice `expected` y que los casos solo verificables con fixtures (M, N, O) tienen sus fechas o su revisor.

```typescript
const NOW = new Date("2026-10-19T09:00:00Z");
const source = new FixtureSource(loadCases(), NOW);
/** Los títulos de los casos empiezan por su clave: "[K] Paginación…" → "K". */
const caseKeys = (items: { title: string }[]) => items.map((item) => item.title.slice(1, 2)).sort();

test("mis PRs activas: D, E y F (G está completada)", async () => {
  assert.deepEqual(caseKeys(await source.myPullRequests()), ["D", "E", "F"]);
});
```

Los IDs del adaptador falso son deterministas (`fixturePullRequestId`, `fixtureWorkItemId`): úsalos en vez de
números escritos a mano.

## 4. Salvaguardas del seed (`scripts/lib/seed.ts`)

Lo que se prueba es que **no escribe** cuando una salvaguarda falla. El cliente falso implementa `SeedClient`,
registra cada petición y lanza `WriteAttempted` ante la primera escritura (todo lo que no sea GET, salvo la
consulta WIQL, que es un POST de lectura).

```typescript
test("proyecto con work items: no escribe", async () => {
  const { dependencies, calls } = buildScenario({ currentUserAccount: { workItemCount: 3 } });

  await assert.rejects(runSeed(dependencies), /ya tiene 3 work items/);
  assert.equal(calls.filter(isWrite).length, 0);
});
```

Cada grupo de "no escribe" lleva un **test de control** que, con todo correcto, sí llega a escribir. Sin él,
un fallo antes de las salvaguardas haría pasar todos los tests sin probar nada.

## Estructura de cada test

- Patrón AAA: preparar, ejecutar, comprobar, separados por una línea en blanco cuando el test pasa de 3 líneas.
- Primero el caso normal y después los límites y los errores.
- Un test por regla o comportamiento; si un nombre necesita "y", probablemente son dos tests.
- Para comprobar que un test sirve, rompe a propósito la regla que cubre, mira que falla y deshaz el cambio.

## Lint en los tests

`eslint.config.js` desactiva en `test/` dos reglas, a propósito: `no-floating-promises` (porque `node:test`
gestiona las promesas de `test()`) y `require-await` (los dobles devuelven datos en memoria con `async`).
No desactives otras reglas con comentarios `eslint-disable`; si una regla molesta, coméntalo con la persona.
