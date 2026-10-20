# azdo-daily-brief

Herramienta que genera un **informe diario** para un desarrollador a partir de Azure DevOps:
PRs que esperan su revisión, sus tareas de la iteración actual y qué le falta a cada una.
Es el caso práctico de un TFM: el código debe ser simple, verificable y reutilizable.

**Al empezar cada sesión**, sigue la skill `iniciar-sesion`. Se trabaja un paso cada vez; al terminar uno,
sigue la lista de cierre.

### Forma de trabajar

**Antes de implementar**
- Cuenta en 2-3 líneas qué vas a hacer, también cuando la persona ya te da la lista de tareas.
- Busca lo que ya existe (`grep` en `CLAUDE.md`, `docs/`, `.claude/`, `eslint.config.js`, `src/`, `test/`) antes de
  añadir una regla, una skill o un check. Si algo ya lo cubre, dilo y propón ampliarlo en vez de duplicarlo.
- No amplíes el alcance: aplica "Hueco frente a opcional" (en Criterios, abajo).

**Lista de cierre** (al terminar cada paso o bloque, antes de darlo por hecho)

Al terminar un paso manda esta lista, también si se usa la skill `traspaso-sesion`. Esa skill solo registra sin
corregir cuando se usa porque el contexto está fallando ([`traspaso-sesion`](.claude/skills/traspaso-sesion/SKILL.md)).

1. `npm run verify` (typecheck, lint y tests) en verde. Si algo falla, corrígelo antes de seguir.
2. `git diff --stat` para listar los archivos cambiados. Si alguno no debería haberse tocado, revísalo y avisa.
   La revisión línea a línea la hace la persona antes de su commit.
3. Relee las instrucciones de la persona en ese turno y comprueba cada una; di cuál queda pendiente y por qué.
4. Bitácora al día según [su formato](docs/bitacora.md#cómo-se-escribe-esta-bitácora); el Próximo paso, al terminar
   y no al empezar. Comprueba que el Estado y el README siguen siendo ciertos.
5. En el mensaje final, no solo en el resumen de cierre: archivos cambiados, cómo verificarlo la persona y lo que
   haya pedido expresamente (por ejemplo, un mensaje de commit).

**Contexto**
- Se trabaja una sesión por paso. Si la persona avisa de que va a cambiar de sesión, deja la bitácora lista para
  que otra sesión continúe sin esta conversación: qué está hecho, qué falta del paso actual y decisiones pendientes.
  
### Criterios

**Ambigüedad.** Si una petición admite dos lecturas que llevan a cambios distintos, no elijas: pregunta con las dos
opciones y lo que implica cada una. Si solo cambia un detalle menor, elige la lectura más literal y dilo.

**Hueco frente a opcional.**
- Hueco: falta algo que exige `docs/plan.md`, `docs/glosario.md`, `fixtures/expected.json` o `docs/enunciado-tfm.md`.
  Se presenta como pendiente, citando la fuente que lo exige. Nunca se ofrece como opcional.
- Opcional: algo útil que ninguna de esas fuentes exige. Se propone y no se hace.

### Bitácora (`docs/bitacora.md`)

El formato y sus reglas están en un solo sitio: [Cómo se escribe esta bitácora](docs/bitacora.md#cómo-se-escribe-esta-bitácora).

## Arquitectura

1. **Recogida (determinista, sin IA)** — `src/`: lee Azure DevOps y escribe `output/snapshot.json`.
   Sigue arquitectura hexagonal: un puerto (interfaz) con dos adaptadores, uno real para la API de
   Azure DevOps y otro falso que lee fixtures. La lógica de vinculación no conoce el adaptador.
   Capas: `src/domain`, `src/ports`, `src/application` (paso 6),
   `src/adapters/azdo` y `src/adapters/fixtures`.
2. **Síntesis (IA)** — skill en `.claude/skills/`: lee `output/snapshot.json` y redacta el informe.
3. **Verificación** — `scripts/` y tests: compara el informe con `fixtures/expected.json`.

Mantén esta separación: la skill de síntesis nunca llama a la API; solo interpreta el snapshot.
El agente de desarrollo sí puede ejecutar los scripts de solo lectura (`check:conn`, `list:prs`, `list:tasks`)
contra el proyecto demo.
Los términos de dominio ("PR envejecida", "bloqueada"…) se definen en `docs/glosario.md`; úsalos tal cual.

### Reglas de arquitectura (comprobadas)

Esta lista es la única fuente de las reglas de capas; el código que las comprueba remite aquí.

- `src/domain` solo importa archivos de `src/domain` (nada de `src/adapters`, del antiguo `src/azdo` ni
  `node:*`, incluido `node:fs`) y no llama a `fetch`.
- `src/ports` solo importa de `src/domain` (y de otros archivos de `src/ports`), y no usa `node:*`.
- En `src/` solo `src/adapters/azdo/read-only-client.ts` hace peticiones a Azure DevOps (`fetch`), y solo GET;
  ningún archivo de `src/` importa `node:http` ni `node:https`.
- Nada en `src/` importa de `scripts/` (ahí está el cliente con escritura).
- Los tests en carpetas `tests/` dentro de `src/` (p. ej. `src/domain/tests/`) no son código de la capa y quedan
  fuera de estas reglas: necesitan `node:test` y `node:assert`. Por eso en `tests/` solo van tests y sus helpers.
- Ningún archivo de `src/` fuera de `tests/` importa de una carpeta `tests/` ni de `#test-helpers/*`.

Las comprueban `test/architecture.test.ts` (en `npm test` y en el pre-push) y `eslint.config.js` (en `npm run lint`).

## Reglas

- **Solo lectura** contra Azure DevOps. El cliente HTTP de `src/` solo implementa GET; no le añadas
  otros métodos. El único código que escribe es el seed del proyecto demo (`scripts/seed-*`),
  que usa su propio token y nunca debe apuntar a una organización real.
- **Práctica: los datos de cliente no se pasan a la IA.** Las cuentas de IA de este proyecto son personales:
  la skill solo se ejecuta sobre el proyecto demo o fixtures, y no se pega material de clientes en el chat.
  Ninguna herramienta lo comprueba; depende de la persona.
- **Nunca** imprimir, registrar ni commitear tokens. Las credenciales viven solo en `.env`.
- `output/` no se sube ni se copia a `docs/`.
- **No hagas commit ni push.** Los hace siempre la persona; tú deja los cambios sin commitear.
  Lista `deny` de `.claude/settings.json` (copiada tal cual): `Bash(git commit *)`, `Bash(git push *)`,
  `Bash(git -C * commit *)`, `Bash(git -C * push *)`, `Read(./.env)`, `Read(./.env.*)`, `Bash(cat .env*)`,
  `Bash(source .env*)`, `Bash(grep * .env*)`.
  Son patrones de prefijo: otras formas del mismo comando no quedan bloqueadas.
- El informe separa **Hechos** (siempre con ID: `PR #12`, `WI #345`) de **Sugerencias**.
  Si falta un dato, escribe "sin datos"; no lo deduce.

## Convenciones

- TypeScript estricto, ESM, Node ≥ 20.12. Ejecutar con `tsx`.
- `fetch` nativo, `process.loadEnvFile()` y `node:test`; no añadir dependencias sin necesidad clara.
- Código y comentarios en español sencillo; nombres de variables en inglés.

### Código limpio

- **Nombres legibles:** palabras completas que digan qué es (`pullRequests`, `workItem`, `testCase`,
  `currentUser`). Nada de letras sueltas ni abreviaturas (`c`, `w`, `pr`, `me`, `prs`, `ctx`, `deps`); únicas
  excepciones: `id` y el índice `i` de un bucle `for`. Los campos que impone la API externa se dejan como vienen.
- **DRY:** lo que se repite en 2 o más archivos se extrae a un módulo compartido (`scripts/lib/`, `test/helpers/`).
  Dentro de un archivo, una constante o función con nombre en vez de repetir el literal.
- **Funciones pequeñas con un solo propósito**, con nombre que diga qué hacen. Si necesitan un comentario
  para explicar *qué* hacen, el nombre no es bueno; los comentarios explican el *porqué*.
- Lo comprobable lo comprueba el lint (`id-length`, `id-denylist` en `eslint.config.js`).

## Comandos

- `npm install` — instala dependencias y activa el hook `.githooks/pre-push` (`npm run verify`).
- `npm run verify` — typecheck, lint y tests seguidos; es el "terminado" de la lista de cierre.
- `npm run typecheck` — comprueba tipos.
- `npm run lint` — ESLint con las reglas de capas y de solo lectura (`eslint.config.js`).
- `npm test` — tests con `node:test` (sin red): junto al código en carpetas `tests/` y, en `test/`, los checks de arquitectura y de que `npm test` encuentra todos los tests. Convenciones en la skill `.claude/skills/testing/`.
- `npm run list:prs` — lista las PRs de la demo y las compara con `fixtures/demo-ids.json` (`-- --fixtures` usa el adaptador falso).
- `npm run list:tasks` — lista los work items de la iteración actual, marca "Mis tareas" y compara con `demo-ids.json` (`-- --fixtures` usa el adaptador falso).
- `npm run collect` — recogida: escribe `output/snapshot.json` y, sobre la demo, compara cada caso con `expected.json` usando `demo-ids.json` (`-- --fixtures` usa el adaptador falso). Umbrales en `.env`: `AGED_PR_DAYS` y `STALE_TASK_DAYS` (3 por defecto).
- `npm run check:conn` — comprueba la conexión con Azure DevOps usando `.env` (solo lectura).
- `npm run seed:demo` — siembra el proyecto demo con los casos de `fixtures/expected.json`. Solo para la demo:
  pide confirmar organización y proyecto, y se niega si el proyecto ya tiene work items o el compañero no
  ve el repositorio. Lógica en `scripts/lib/seed.ts` (probada en `scripts/lib/tests/seed.test.ts`).

## Casos de prueba

`fixtures/expected.json` es la única fuente de los casos: el seed lee `setup` y el verificador lee `expected`.
Para añadir un caso, añádelo ahí; no dupliques la lista en otro archivo.
