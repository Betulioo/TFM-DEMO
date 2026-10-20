---
name: testing
description: Cómo escribir tests de este proyecto: herramientas y dobles (node:test + assert/strict, sin red ni tokens) — reglas del dominio, adaptador real con lector falso, adaptador falso desde expected.json y salvaguardas del seed. Úsala al añadir o cambiar código en src/ o scripts/, al escribir tests nuevos o cuando se pida "testear" algo. Qué debe comprobar cada test está en la skill tests-semanticos.
---

# Tests del proyecto

Los tests son la comprobación de que la recogida es determinista y correcta **sin depender de la API real**.
Esta skill cubre el **cómo** (herramientas, dobles y estructura). El **qué** (qué protege cada test, nombres,
aserciones, tiempo y negativos) está en la skill [`tests-semanticos`](../tests-semanticos/SKILL.md): aplica las dos.

## Reglas comunes (todas obligatorias)

- **Herramientas:** `node:test` (`describe` e `it`) y `node:assert/strict`. Nada de Jest ni dependencias nuevas.
  Un `describe` por término del glosario o por comportamiento del módulo; cada `it` nombra el caso.
- **Ubicación:** junto al código que prueban, en una carpeta `tests/`: `src/domain/rules.ts` →
  `src/domain/tests/rules.test.ts`, `scripts/lib/seed.ts` → `scripts/lib/tests/seed.test.ts`. Las carpetas
  `tests/` de `src/` quedan fuera de las reglas de capas (`CLAUDE.md`): en ellas solo van tests y sus helpers.
  En `test/` queda lo que no prueba un módulo concreto (`architecture.test.ts`, `test-discovery.test.ts`) y los
  helpers compartidos. `npm test` busca en `test/*.test.ts`, `src/*/tests/`, `src/*/*/tests/` y `scripts/*/tests/`
  (globs de la shell): una carpeta `tests/` a otra profundidad necesita su patrón en `package.json`, y
  `test/test-discovery.test.ts` falla si falta.
- **Helpers:** locales en el archivo. Si tests de carpetas distintas comparten un helper, va a `test/helpers/` y se
  importa con el alias `#test-helpers/…` (campo `imports` de `package.json`), no con rutas `../../../`.
- **Sin red, sin `.env`, sin tokens.** Ningún test crea `AzdoReadOnlyClient` ni `AzdoWriteClient`: se les pasa
  un doble que implementa la interfaz real (`AzdoReader`, `SeedClient`, `DevOpsSource`). Así, si la interfaz
  cambia, el test deja de compilar.
- **Fechas:** `const NOW = new Date(NOW_ISO)` en cada archivo (`NOW_ISO` de `#test-helpers/test-data.js`; un
  `Date` compartido se puede modificar) y fechas ISO literales. El lint rechaza `new Date()` sin argumento en los
  tests (el porqué: `tests-semanticos`, criterio 3).
- **Nombres de test en español.** Qué deben citar: `tests-semanticos`, criterio 1.
- **Aserciones:** criterios 2 y 4 de `tests-semanticos`. Excepción de forma: en los tests de traducción
  API → dominio se compara el objeto completo con `assert.deepEqual`.
- **Casos A–O:** salen de `fixtures/expected.json`. No copies la lista de casos en un test.
- **Datos explícitos y mínimos:** cada test construye solo lo que importa para su regla con un helper local
  (`buildWorkItem(...)`, `buildApiPullRequest(...)`, `buildApiWorkItem(...)`).

## 1. Dominio (`src/domain/rules.ts`, tests en `src/domain/tests/`)

Funciones puras: sin dobles, sin `async`, datos explícitos. Si la regla depende del tiempo o de un umbral,
recibe `now` y el umbral como parámetros; el test los fija.

```typescript
describe("Mis tareas", () => {
  it("el tipo no filtra (procesos personalizados)", () => {
    const workItems = [buildWorkItem(8, { type: "Bug desarrollo" }), buildWorkItem(9, { type: "Epic" })];

    const result = myTasks(workItems, CURRENT_USER);

    assert.deepEqual(ids(result), [8, 9]);
  });
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

it("mis PRs: filtra por creador", async () => {
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
Junto con las reglas del dominio comprueban también el resultado (siguiente paso, tarea estancada): lo esperado se
lee de `expected.json` (`expectedByCase`), no se copia en el test.

```typescript
const source = new FixtureSource(loadCases(), NOW);
/** Los títulos de los casos empiezan por su clave: "[K] Paginación…" → "K". */
const caseKeys = (items: { title: string }[]) => items.map((item) => item.title.slice(1, 2)).sort();

it("mis PRs activas: D, E y F (G está completada)", async () => {
  const pullRequests = await source.myPullRequests();

  assert.deepEqual(caseKeys(pullRequests), ["D", "E", "F"]);
});
```

Los IDs del adaptador falso son deterministas (`fixturePullRequestId`, `fixtureWorkItemId`): úsalos en vez de
números escritos a mano.

## 4. Salvaguardas del seed (`scripts/lib/seed.ts`)

Lo que se prueba es que **no escribe** cuando una salvaguarda falla. El cliente falso implementa `SeedClient`,
registra cada petición y lanza `WriteAttempted` ante la primera escritura (todo lo que no sea GET, salvo la
consulta WIQL, que es un POST de lectura). El escenario pasa `print() {}` para que los mensajes del seed no
llenen la salida de `npm test`.

```typescript
describe("Salvaguardas del seed: si una comprobación falla, no escribe", () => {
  it("proyecto con work items", async () => {
    const { dependencies, calls } = buildScenario({ currentUserAccount: { workItemCount: 3 } });

    const seeding = runSeed(dependencies);

    await assert.rejects(seeding, /ya tiene 3 work items/);
    assert.equal(calls.filter(isWrite).length, 0);
  });
});
```

Cada grupo de "no escribe" lleva un **test de control** que, con todo correcto, sí llega a escribir. Sin él,
un fallo antes de las salvaguardas haría pasar todos los tests sin probar nada.

## Estructura de cada test

- Patrón AAA (*Arrange, Act, Assert*) siempre, también en los tests cortos: preparar los datos, guardar el
  resultado de la acción en `result` (o `results`) y comprobarlo, con una línea en blanco entre los tres. Sin
  comentarios `// Arrange`. La acción es la llamada que se prueba (la regla o el método del adaptador); buscar un
  caso en su resultado (`find`) es parte de comprobar, no de la acción. Si no hay nada que preparar, el test
  empieza por la acción. Una acción que debe fallar se guarda sin `await` y se comprueba con `assert.rejects`.
- Primero el caso normal y después los límites y los errores.
- Un test por regla o comportamiento; si un nombre necesita "y", probablemente son dos tests.
- Para comprobar que un test sirve, rompe a propósito la regla que cubre, mira que falla y deshaz el cambio.

## Lint en los tests

`eslint.config.js` añade en los tests (`test/` y las carpetas `tests/` de `src/`) la regla contra `new Date()` sin argumento y desactiva dos, a propósito: `no-floating-promises` (porque `node:test`
gestiona las promesas de `test()`, `describe()` e `it()`) y `require-await` (los dobles devuelven datos en memoria con `async`).
No desactives otras reglas con comentarios `eslint-disable`; si una regla molesta, coméntalo con la persona.
