# Bitácora del proyecto

Estado, decisiones, errores y aprendizajes. Se actualiza al terminar cada paso.
Sirve como contexto para el agente y como evidencia para el documento del TFM.
Las normas de cada sección están en `CLAUDE.md`.

## Estado

- [ ] 0. Medir la rutina manual en el cliente (tiempos y volúmenes, sin datos)
- [x] 1. Estructura del repo, `CLAUDE.md`, README esqueleto
- [x] 2. Organización demo en Azure DevOps, tokens y `check:conn`
- [x] 3. Glosario (`docs/glosario.md`), casos sembrados (`fixtures/expected.json`) y seed
- [x] 4. Puerto, adaptador falso y adaptador Azure DevOps: PRs donde el usuario es revisor
- [x] 4.5. Seguridad y calidad: capas hexagonales, lint, pre-push y salvaguardas
- [x] 5. Work items de la iteración actual
- [ ] 6. Vinculación work item ↔ rama ↔ PR, `output/snapshot.json` y tests unitarios
- [ ] 7. Skill de informe diario (Hechos / Sugerencias)
- [ ] 8. Verificador y eval: skill frente a prompt plano, mismo snapshot, chats nuevos
- [ ] 8b. (Opcional) CLI `npm run brief` con `claude -p`
- [ ] 8c. (Opcional) Integración con Obsidian por archivos
- [ ] 9. Medición del uso de la herramienta en la demo
- [ ] 10. CI (GitHub Actions), ADR, README final y tag `v1.0`
- [ ] 11. Cálculo de negocio (medido frente a estimado)
- [ ] 12. Documento técnico
- [ ] 13. Vídeo (opcional) y comprobación de accesos

## Próximo paso

**Estado (2026-10-20):** paso 6 empezado, con alcance revisado (sin ramas; con PRs del equipo). Hecho: reglas de
PR en `src/domain/rules.ts` (`isActive`, `isPendingMyReview`, `isPendingTeamReview`, `isBlocked`, `isApproved`,
`isAged`), días naturales en `src/domain/dates.ts`, `myTeams()` y `pullRequestsToReviewByTeam()` en el puerto y los
dos adaptadores, caso O en `expected.json` (validado en `validateCases`) y glosario sin ramas. Sin commitear.
`npm run typecheck`, `npm run lint` y `npm test` (65/65) en verde.

**Seguir por:** reglas "tarea estancada" (con `hasElapsedDays`) y "siguiente paso" (solo tareas con PR) en
`src/domain/rules.ts`. Después: `src/application/collect-snapshot.ts` y `npm run collect`, que debe quitar
duplicados si una PR sale a la vez como mía y del equipo (ver Problemas abiertos).

**Decisiones pendientes**
- Si una PR deja de estar "pendiente del equipo" cuando otro miembro ya ha votado por el equipo. La definición
  actual no lo mira; falta ver en la demo qué voto muestra el equipo en ese caso.
- Si se crea el caso O en la demo a mano (PR del compañero con "TFM Demo Team" como revisor) para comprobar el
  adaptador real. El seed no puede: se niega en un proyecto con work items.
- Si las comprobaciones usadas al renombrar (textos literales sin cambios y regresión de peticiones del seed) pasan
  a ser un script del repo (`scripts/check-rename.ts`). Propuesto, no hecho.
- Si se añaden al `CLAUDE.md` las instrucciones de trabajo dadas solo en el chat (ver propuesta del traspaso).

**Problemas abiertos** (detectados, sin corregir; ninguno rompe los checks)
- Las skills `testing` y `tests-semanticos` se solapan: `testing` aún contiene reglas de "qué" (nombres con
  términos del glosario, fechas fijas, comparar IDs).
- `test/architecture.test.ts` no detecta `fetch` usado sin llamar directamente (`const f = fetch`) ni un `method`
  pasado en una variable; el lint sí marca cualquier uso de `fetch`. Límite no documentado en el test.
- `azdo-source.ts` convierte `status`, `vote` y `category` de la API con `as`, sin validar el valor.
- El paso 0 (medir la rutina manual en el cliente) sigue pendiente y lo hace la persona.
- PRs del equipo sin comprobar con datos reales: que `searchCriteria.reviewerId={teamId}` devuelva las PRs con el
  equipo como revisor, que el revisor lleve el mismo `id` que `teams?$mine=true`, y si `reviewerId={miId}` ya
  incluye las PRs de mis equipos (habría duplicados entre las dos listas). En la demo ninguna PR tiene un equipo
  como revisor.
- `myTeams()` no pagina: la API devuelve 100 equipos por defecto (según la documentación; no comprobado).

## Registro

### 2026-10-19

**Progreso**
- Pasos 1 y 2: estructura del repo, organización demo, tokens y `npm run check:conn`.
- Paso 3: glosario, `fixtures/expected.json` (casos A–N) y seed. Seed completado en la organización demo
  `TFM-Jakala` (creada para el TFM, sin datos de cliente; sustituye a `TFM-Demo`). IDs en
  `fixtures/demo-ids.json`. Verificado con el token de lectura: en "Sprint actual" están A–H y J, I queda
  fuera; PRs D, E, F, K y L activas con los votos esperados y G completada.
- Paso 4: tipos de dominio (`src/domain/types.ts`), puerto `DevOpsSource`, adaptador real (`AzdoSource`,
  solo GET) y falso (`FixtureSource`), `npm run list:prs` y `npm test` (10 tests, sin red). Contra la demo:
  revisor en K y L, mías D, E y F, G completada por ID; coincide con `fixtures/demo-ids.json`.
- Paso 4.5, bloque A: estructura hexagonal. `src/azdo/*` y `azdo-source.ts` → `src/adapters/azdo/`;
  `fixture-source.ts` y `cases.ts` → `src/adapters/fixtures/`. Solo rutas de import; typecheck, 10 tests,
  `list:prs` y `check:conn` siguen pasando. Reglas de capas comprobadas con grep (el lint las fijará en B).
- Paso 4.5, bloque B: ESLint 10 + typescript-eslint 8 (`recommendedTypeChecked`) y `npm run lint`. Reglas
  propias: capas con `no-restricted-imports` y `fetch` prohibido en `src/` salvo el cliente de solo lectura.
  Probado con archivos temporales: las 6 violaciones (domain → adapters, domain → `node:fs`, ports →
  adapters, src → scripts y dos `fetch`) fallan; el import permitido dentro de `domain/` pasa.
- Paso 4.5, bloque C: `.githooks/pre-push` (typecheck + lint + tests) activado por el script `prepare`
  (`git config core.hooksPath .githooks`). Probado ejecutando el hook: en verde sale con 0; con un test roto
  temporal sale con 1. La persona hizo un `git push` real con todo en verde y pasó. El caso de push
  bloqueado solo se ha probado ejecutando el hook a mano.
- Paso 4.5, bloque D: `.claude/settings.json` con `deny` de `git commit`, `git push` y `Read(./.env)`
  (probado: `git commit --dry-run` queda denegado). El seed pide confirmar organización y proyecto. Su
  lógica pasa a `scripts/lib/seed.ts` con clientes inyectados y `test/seed.test.ts` cubre las salvaguardas:
  confirmación incorrecta (0 peticiones), misma cuenta, compañero sin repos, proyecto sin repo y proyecto con
  work items (0 escrituras), más un control que sí llega a escribir. 18 tests, lint y typecheck en verde.
- Paso 5: tipos `Iteration` y `WorkItem`, métodos `currentIteration` y `workItemsInIteration` en el puerto y
  en los dos adaptadores, regla `myTasks` en `src/domain/rules.ts` y `npm run list:tasks`. 29 tests, lint y
  typecheck en verde. Contra la demo: A–G en mis tareas; H, I y J fuera; D–G enlazan sus PRs (#2–#5).
- Antes del paso 6: `test/architecture.test.ts` (3 reglas de la sección "Arquitectura" de `CLAUDE.md`, con un
  control por regla; probado además rompiendo `rules.ts` a propósito), skill `tests-semanticos` y sección A de
  `revisar-tfm` actualizada para ejecutar el check y revisar los tests con esa skill. 36 tests en verde.
- Correcciones tras una reflexión del agente: `CLAUDE.md` vuelve a decir que `src/domain` solo importa de
  `src/domain` (se había perdido al reorganizar) y añade `ports` y `node:http(s)`; el test de arquitectura y el
  lint comprueban ahora el mismo conjunto (probado con archivos temporales: ambos detectan las mismas
  violaciones de imports). `tests-semanticos` acepta también reglas de `CLAUDE.md` como lo que protege un test
  (si no, marcaría los tests del seed y de arquitectura) y ya no repite la regla de credenciales. 38 tests.
- Clean code, bloque de reglas: `CLAUDE.md` → "Código limpio" y `id-length` / `id-denylist` en `eslint.config.js`
  (warn). Línea base: 176 avisos (99 `id-length`, 77 `id-denylist`): `src` 21, `scripts` 90, `test` 64 y
  `eslint.config.js` 1.
- Clean code, bloque `src`: 21 avisos → 0 (`azdo-source.ts`, `fixture-source.ts`, `cases.ts`, `rules.ts`). Solo
  nombres internos; las interfaces exportadas no cambian. DRY: `daysBefore(now, days)` en el adaptador falso en
  vez de repetir el cálculo. Lint, typecheck, 38 tests, `list:prs` y `list:tasks` contra la demo en verde.
- Clean code, bloque `scripts`: 90 avisos → 0. DRY: `scripts/lib/demo.ts` (`DEMO_IDS_PATH`, tipo `DemoIds`,
  elegir adaptador por `--fixtures`, leer `demo-ids.json`, líneas OK/FALLO, resumen y `runScript`), usado por
  `list-prs`, `list-tasks` y `seed-demo`. En `seed.ts`: `SeedDeps` → `SeedDependencies`, `Ctx` → `SeedContext`,
  `me`/`mate` → `currentUserClient`/`teammateClient`… (en `test/seed.test.ts` solo esos nombres, para compilar).
  Verificado: lint, typecheck, 38 tests, `list:prs` y `list:tasks` contra la demo, y una regresión sin red que
  ejecuta el `runSeed` anterior y el nuevo con el mismo cliente falso: 54 peticiones idénticas.
- Clean code, bloque `test` y cierre: 64 avisos → 0 en `test/` (`buildWorkItem`, `buildApiPullRequest`,
  `buildApiWorkItem`, `caseKeys`, `hasCaseKey`, `buildScenario`, `currentUserAccount`…; los nombres de los tests no
  cambian). `id-length` e `id-denylist` pasan a `error` y `js` → `eslintJs` en `eslint.config.js`: `npm run lint`
  sin problemas, y un archivo de prueba con `c` y `prs` falla. Mutaciones de control: quitar la comprobación de
  proyecto vacío y tratar Completed como abierta hacen fallar 3 tests. Ejemplos de la skill `testing` actualizados
  a los nombres nuevos.
- Paso 6, reglas de PR: `isActive` (estado *active* y no borrador), `isPendingMyReview`, `isBlocked`,
  `isApproved` e `isAged(pullRequest, now, agedPrDays)` en `src/domain/rules.ts`. 16 tests nuevos en
  `test/rules.test.ts` (positivos, negativos, borradores y PR no activas, límite de 2, 3 y 4 días, un minuto antes
  del umbral y umbral configurable). Mutaciones de control: cambiar `>=` por `>` en `isAged` y quitar `isActive`
  de `isBlocked` hacen fallar 3 tests; restaurado, 54/54.
- Paso 6, ramas: `branchNames()` en `DevOpsSource`. `AzdoSource` lista los repositorios del proyecto, salta los
  deshabilitados y pide `refs?filter=heads/` de cada uno; `FixtureSource` devuelve `main`, las ramas de los casos
  con `"branch": true` (`feat/{id}_{clave}`) y las de las PRs de revisión. 4 tests nuevos (2 por adaptador).
  Mutaciones de control: no saltar deshabilitados y no quitar `refs/heads/` hacen fallar 2 tests. Contra la demo,
  `branchNames()` devuelve 8 ramas: `feat/8_…` a `feat/12_…` (C–G, IDs de `demo-ids.json`), las de K y L y `main`.
- Paso 6, alcance revisado: `branchNames()` retirado (revertidos los 5 archivos; no estaba commiteado). Glosario:
  fuera "Rama de una tarea" y los pasos "Abrir PR", "Crear rama" y "Empezar"; una tarea sin PR no tiene siguiente
  paso. `expected.json`: `nextStep` de A, B, C y N pasa a `null`; `setup.branch` se mantiene porque el seed
  necesita rama para crear una PR. `BRANCH_ID_PATTERN` fuera de `.env.example`.
- Paso 6, PRs del equipo: tipo `Team`, "Mis equipos" y "PR pendiente del equipo" en el glosario,
  `isPendingTeamReview`, `myTeams()` y `pullRequestsToReviewByTeam()` en el puerto y los dos adaptadores, y el caso
  O (`verifiedIn: "fixtures"`, `reviewer: "myTeam"`). El seed lanza un error si recibe un caso con el equipo como
  revisor (no llega a pasar: salta los casos de fixtures). 8 tests nuevos. Mutación de control: quitar "no figura
  como revisor individual" hace fallar 1 test. Contra la demo: `myTeams()` devuelve "TFM Demo Team" y
  `pullRequestsToReviewByTeam()` ninguna PR. `list:prs` y `list:tasks` siguen coincidiendo con `demo-ids.json`.

**Decisiones**
- Tema: flujo de "estado del día" sobre Azure DevOps (Repos + Boards). Descartada la pre-revisión
  de PRs: menos original y su calidad es más difícil de medir.
- Arquitectura: recogida determinista + síntesis con IA. Motivo: el resultado de la IA se puede
  comprobar contra datos que no dependen de ella.
- Stack: Node/TypeScript (perfil front), sin dependencias de runtime.
- Las cuentas de IA son personales → ningún dato del cliente pasa por la IA. Del cliente solo se
  usa el tiempo medido de la rutina manual; la herramienta se ejecuta y mide en un proyecto demo.
- Plan ampliado con conceptos del track: glosario, arquitectura hexagonal, eval con y sin skill,
  CI como comprobación externa, ADR y esta bitácora. Descartados subagentes y loops: el flujo
  tiene un único paso de síntesis y no los necesita.
- Proyecto demo con proceso **Agile**. El cliente usa un proceso personalizado (tipos propios como
  "Bug desarrollo"), así que la herramienta no filtra por tipo de work item: filtra por asignación e
  iteración y usa las categorías de estado (Proposed, InProgress, Resolved, Completed), comunes a
  todos los procesos.
- El "siguiente paso" de cada tarea se calcula con reglas en código (ver `docs/glosario.md`), no con
  IA: son transiciones conocidas. La IA prioriza y redacta.
- Convención de ramas del equipo: `feat/12345_nombre_tarea`. La regla de vinculación exige el ID justo
  después del prefijo (patrón configurable).
- `fixtures/expected.json` es la única fuente de casos (seed + verificador), para que no se desincronicen.
- El seed tiene salvaguardas en código: confirmación escribiendo el nombre del proyecto, rechazo si el
  proyecto no está vacío, tokens propios de la demo y comprobación de que el compañero ve el repositorio
  (si tú tampoco ves ninguno, avisa de que el proyecto no tiene repositorio). Probadas con un servidor
  falso: no hace ninguna escritura cuando aborta.
- Limitaciones de la demo: Azure DevOps no permite crear datos con fecha pasada, así que "PR envejecida"
  y "tarea estancada" (casos M y N) solo se verifican con fixtures. Los casos K y L requieren una
  segunda cuenta.
- Los commits y el push los hace siempre la persona, no el agente (regla en `CLAUDE.md`). El agente hizo
  el commit del paso 3 porque se le pidió; ese commit se mantiene.
- Formato de la bitácora: se adaptan ideas de la skill `mantener-bitacora-sesion` del track (próximo paso
  vigente, errores aparte, hechos frente a inferencias) sin instalarla: está pensada para una sesión y
  pide podar, y esta bitácora cubre todo el proyecto y es evidencia del TFM.
- El puerto crece por pasos: en el paso 4 solo tiene usuario y PRs; work items y ramas se añaden en 5 y 6
  para no definir métodos que aún no se pueden probar.
- El adaptador falso no lee un JSON propio: genera los datos desde `fixtures/expected.json` con fechas
  relativas a `now`, para no duplicar la lista de casos. `cases.ts` pasa de `scripts/lib/` a `src/fixtures/`
  porque ahora lo usa `src/`.
- Los adaptadores devuelven también los borradores (`isDraft`); excluirlos es una regla del glosario y se
  aplica en el dominio (paso 6).
- Paso 4.5 (seguridad y calidad) aprobado antes del paso 5: capas hexagonales, lint con reglas de capas y
  de solo lectura, hook pre-push y salvaguardas extra (diseño en `docs/plan.md`).
- `src/application/` no se crea hasta el paso 6, cuando tenga el caso de uso `collect-snapshot`.
- El cliente de solo lectura puede importar el tipo `AzdoConfig` de `src/config.ts`; nada más de `src/`
  depende de `config.ts`.
- `no-floating-promises` desactivada solo en `test/`: `node:test` gestiona las promesas de `test()`.
- `require-await` desactivada solo en `src/adapters/fixtures/` y `test/`: allí `async` sin `await` es
  intencionado (datos en memoria). Primero se cambió a `Promise.resolve(...)` para cumplir la regla, pero se
  revirtió a petición de la persona porque `async` se lee mejor. En el resto del código la regla sigue activa.
- Hook con `core.hooksPath` en vez de husky: sin dependencias nuevas. Se puede saltar con
  `git push --no-verify`; la comprobación obligatoria será la CI del paso 10.
- La regla `Read(./.env)` no se ha probado a propósito: si no estuviera activa, la prueba leería los tokens.
- El seed se separa en entrada (`scripts/seed-demo.ts`: `.env`, terminal, archivo) y lógica
  (`scripts/lib/seed.ts`), igual que la recogida separa adaptadores y dominio, para probarlo sin red.
- Añadidos al plan dos pasos opcionales tras el paso 8, sin implementar todavía: 8b, CLI `npm run brief`
  (recogida + `claude -p` con la skill + guardado), y 8c, integración con Obsidian por archivos
  (`OBSIDIAN_VAULT_PATH`, notas por tarea y PR con sección Contexto que entra en el snapshot). Se descarta el
  MCP de Obsidian: dependencia de terceros, riesgo de seguridad y menos verificable, cuando el vault es una
  carpeta de Markdown.
- El adaptador devuelve todos los work items de la iteración; "Mis tareas" se filtra en el dominio
  (`myTasks`), por asignado (id) y categoría de estado, nunca por tipo.
- Las categorías de estado se leen de la API por tipo y se cachean; el adaptador falso usa las de Agile.
  Un estado sin categoría es un error explícito, no se adivina.
- El adaptador ya extrae los IDs de PR de los enlaces del work item (`pullRequestIds`), que usará el paso 6.
- Skill de proyecto `testing` (`.claude/skills/testing/SKILL.md`), adaptada de una skill de tests unitarios
  con Jest: mismas ideas (tipos de test, datos explícitos, entrada de la API frente a dominio, AAA) con las
  herramientas y los dobles reales del repo (`node:test`, lector falso, `FixtureSource`, cliente falso del seed).
- Las reglas de arquitectura se comprueban con un test automático y no con una skill: una regla comprobable
  debe comprobarse con código. Las skills quedan para lo que necesita criterio (`tests-semanticos`: si un test
  protege un comportamiento con significado). Las reglas de capas se escriben una sola vez, en `CLAUDE.md`
  ("Reglas de arquitectura (comprobadas)"); el test, `eslint.config.js` y `revisar-tfm` remiten a ellas. El
  bloque A de `docs/plan.md` es el diseño histórico, no la fuente vigente.
- Prevención de los fallos del agente en `CLAUDE.md` ("Forma de trabajar") y no en una skill: es corta, aplica en
  todas las sesiones y se carga siempre. Lo que se puede comprobar con código ya lo comprueban lint, tests y
  pre-push; la lista cubre lo que no (releer instrucciones, revisar el diff, escribir el contenido en el mensaje).
- Clean code (nombres legibles, DRY), aprobado: reglas en `CLAUDE.md` ("Código limpio"), lo comprobable en el
  lint (`id-length` mínimo 3 con excepciones `id` e `i`; `id-denylist` para `prs`, `ctx`, `deps`…) y renombrado
  por bloques. Las reglas entran como `warn` para no romper lint y pre-push durante el renombrado, y pasan a
  `error` al terminar. `me` y `pr` también se renombran (`currentUser`, `pullRequest`): sin excepciones de dominio.
- "N días naturales o más" se calcula como tiempo transcurrido ≥ N × 24 h desde `createdAt`, no por fechas de
  calendario, para que no dependa de la zona horaria. Propuesta del agente, confirmada por la persona; se aplica
  también a "tarea estancada".
- El puerto devuelve solo nombres de rama (`string[]`), no un tipo `Branch` con repositorio: las definiciones del
  glosario solo usan el nombre. Si hace falta el repositorio, se amplía.
- Las ramas salen del alcance: la persona no quiere que la herramienta diga "crear rama" o "abrir PR"; quiere las
  PRs asignadas a ella o a su equipo y sus tareas. Una tarea sin PR sale con su estado y, si lo está, estancada.
  Observación del agente, no dicha por la persona: su plantilla de Obsidian ya guarda la rama en `branch:` (paso 8c).
- PRs del equipo: el equipo cuenta si es revisor de la PR. Van en una lista aparte de "pendientes de mi
  revisión" (decisión de la persona). Para que una PR no salga en las dos listas, "pendiente del equipo" exige
  que el usuario no figure como revisor individual (precisión del agente sobre la definición propuesta, que
  decía "no estás como revisor con voto").
- Paso 8c: la nota de Obsidian se buscará por `azure_id` en el frontmatter, con la plantilla de la persona
  (`estado`, `branch`, secciones "Qué hay que hacer", "Cómo se prueba" y "Notas"). Pendiente de pasar a `docs/plan.md`.

**Aprendizajes**
- El material del track (`docs/contexto-track.md`) prohíbe usar cuentas personales con datos de
  cliente. Se detectó antes de construir, lo que evitó rehacer el paso 9.
- La opción de proceso solo aparece al crear el proyecto (desplegable *Advanced*).
- Endpoints del paso 5 probados ya contra la API real y coinciden con `docs/plan.md`:
  `teamsettings/iterations?$timeframe=current` devuelve el sprint actual; `iterations/{id}/workitems`
  devuelve los IDs en `workItemRelations[].target.id` (el plan no indicaba la forma de la respuesta).
- Endpoints del paso 4 probados contra la API real y coinciden con `docs/plan.md`: listado de PRs con
  `searchCriteria.reviewerId` / `searchCriteria.creatorId` + `searchCriteria.status=active`, y
  `{project}/_apis/git/pullrequests/{id}` para una PR completada. No se ha probado la paginación real
  (`$top`/`$skip`): la demo tiene menos de 100 PRs; solo está cubierta por un test con lector falso.
- Límites del lint (no cubiertos): `globalThis.fetch` o módulos como `node:https` en un adaptador saltarían
  la regla de `fetch`. La garantía principal de solo lectura sigue siendo que el cliente solo tiene `get`.
- Límites de las reglas `deny`: bloquean las herramientas del agente, pero un comando de shell distinto
  (p. ej. `cat .env`) no queda cubierto por `Read(./.env)`. Son una capa más, no una garantía.
- La bitácora decía que las salvaguardas del seed se habían probado con un servidor falso, pero esa prueba
  no estaba en el repo. Ahora sí: `test/seed.test.ts`.
- API real, paso 5 (2026-10-19): el `id` de `connectionData` coincide con `System.AssignedTo.id`;
  `$expand=relations` no se puede combinar con `fields` (400); el endpoint de estados devuelve `category`, que
  **depende del tipo** (Agile: `Resolved` es InProgress en User Story y Resolved en Bug; Bug no tiene
  `Removed`); el enlace a PR usa `%2f` en minúscula. Todo lo demás coincide con `docs/plan.md`.
- API real, ramas (2026-10-19): `_apis/git/repositories` devuelve `isDisabled` en cada repositorio (la demo tiene
  uno, `TFM Demo`); `refs?filter=heads/` devuelve `{ value, count }` con `name` (`refs/heads/…`), `objectId`,
  `creator` y `url`. La rama de G sigue existiendo aunque su PR está completada. Sin paginar: con 8 ramas no se ha
  comprobado qué pasa con muchas (según la documentación, la API pagina con `$top` y `continuationToken`; no comprobado, y el cliente no lo lee).
- API real, equipos (2026-10-19): `_apis/projects/{project}/teams?$mine=true` funciona con el token de lectura y
  devuelve `id`, `name`, `description`, `identityUrl`… El `id` del equipo es el de su identidad. En la demo ninguna
  PR tiene un equipo como revisor: los revisores individuales vienen sin `isContainer`.

**Errores y correcciones**
- Vinculación rama ↔ tarea con "el nombre contiene el número": daba falsos positivos con ramas como
  `fix/2024_dependencias`. Corrección: el ID debe ir justo después del prefijo.
- `_apis/connectionData` devolvía 400: es un endpoint en preview y exige `api-version=7.1-preview`.
  Corrección: usar esa versión; el cliente ahora muestra el mensaje de error de Azure DevOps para
  diagnosticar sin adivinar.
- Primera ejecución real del seed: falló en el caso E con `400 The reviewer '…' does not have permission
  to view this pull request` y dejó el proyecto a medias (A–E creados). La segunda cuenta veía el
  proyecto pero 0 repositorios: tenía acceso *Stakeholder*, que en proyectos privados no incluye Repos.
  Corrección: se pasó la cuenta a *Basic* y el seed terminó sin errores; además, el seed comprueba el
  acceso del compañero antes de escribir nada.
- Lint de capas con `group: ["../*", "!../domain/**"]`: la negación no reincluye nada después de excluir
  `../*` (semántica de `.gitignore`), así que `ports` → `domain` fallaba al aplicarla a `ports`; en `domain` no se
  notaba porque importa con `./`. Corrección: patrones `regex` (`^\.\./(?!domain/)`).
- Análisis de los fallos del agente detectados en su reflexión (antes del paso 6):

  | Fallo | Causa |
  |---|---|
  | No dio archivos ni mensaje de commit por punto, ni cómo verificarlo | Cerró el turno con un resumen genérico sin releer las instrucciones concretas de ese turno. No hay lista de cierre. |
  | Añadió un check de arquitectura sin avisar de que el lint ya lo hacía, y quedaron distintos | No buscó qué existía antes de añadir. |
  | Al reorganizar `CLAUDE.md` se perdió "`src/domain` no importa nada de fuera" | Reescribió un párrafo sin revisar el `git diff`. |
  | Decisión en la bitácora inexacta ("reglas en un solo sitio") | Escribió la intención, no el estado comprobado con `grep`. |
  | "Próximo paso" desactualizado | Lo actualizó al empezar y no al terminar. |
  | `tests-semanticos` repetía `CLAUDE.md` y su criterio 1 dejaba fuera los tests del seed y de arquitectura | Siguió la especificación al pie de la letra sin contrastarla con los tests existentes. |
  | Amplió el alcance (tabla de tests en `revisar-tfm`) y no contó el plan antes | No aplicó la forma de trabajar al recibir una lista de tareas ya detallada. |

  | En el turno siguiente anunció propuestas "abajo" que no escribió, ni la explicación de los tests | El contenido para la persona fue al resumen de cierre del turno y no al mensaje. Es la causa concreta del primer fallo. |

  Patrón común: **no comprobar contra lo que ya existe** (`grep`, `git diff`) y **cerrar sin lista de
  comprobación**. Mejora aplicada: sección "Forma de trabajar" en `CLAUDE.md` (antes de implementar + lista de
  cierre de 5 puntos).
- Renombrado de `refs` → `references` en `seed.ts` con una expresión regular: cambió también texto de la API
  (`"refs/heads/main"` y el endpoint `/refs`). Ningún test lo detectaba (el control del seed para en la primera
  escritura). Se vio al revisar el diff. Corrección: restaurar los literales y comprobar dos cosas en cada
  renombrado: (1) que los textos literales del archivo no cambian y (2) una regresión antes/después de las
  peticiones del seed con un cliente falso. Lección: un renombrado automático nunca debe tocar cadenas.
- Bloque `test`: una sustitución con expresión regular no renombró `...wi(7` (el patrón excluía lo precedido de
  punto); lo detectaron typecheck y tests. Desde ahí, los tests se reescribieron enteros en vez de sustituir.
  Además, los ejemplos de la skill `testing` seguían con los nombres antiguos (los habría enseñado a pesar del
  lint); se vio al buscar nombres antiguos en `docs/` y `.claude/skills/` (lista de cierre, "busca lo que existe").
- Paso 6, ramas: se implementó `branchNames()` siguiendo el plan (traerse todas las ramas del proyecto) sin
  preguntar para qué las quería la persona. Al revisarlo, la persona vio que no escala en un proyecto grande y
  que no necesita las ramas. Se retiró sin commitear. Cambia: antes de implementar una parte del plan que añade
  datos al informe, confirmar que la persona los quiere y cómo escala la consulta.

### 2026-10-20

**Progreso**
- Correcciones tras la reflexión del paso 6 (pedidas por la persona, con las skills `testing` y
  `tests-semanticos` cargadas):
  - DRY: la duración de un día estaba en `rules.ts`, en `fixture-source.ts` y a mano en `test/rules.test.ts`.
    Ahora vive en `src/domain/dates.ts` (`MILLISECONDS_PER_DAY`, `daysBefore`, `hasElapsedDays`).
  - La comprobación "PR con el equipo como revisor solo en fixtures" pasa del seed a `validateCases` en
    `src/adapters/fixtures/cases.ts`, junto a "una PR necesita rama", y así falla antes de escribir. El seed solo
    conserva una comprobación que acota el tipo. Tests nuevos en `test/cases.test.ts` (también para "una PR
    necesita rama", que no tenía test).
  - `ApiTeam` para la respuesta de equipos (como `ApiPullRequest`) y `reviewersFor` en el adaptador falso.
  - Tests: PR abandonada en "PR pendiente del equipo" y el test del adaptador falso separado en dos (uno por
    comportamiento). Mutaciones de control: cambiar el filtro de "mis equipos" por "tiene revisores" hace fallar 1
    test; quitar la condición de fixtures en `validateCases` hace fallar su test (y rechaza `expected.json`).
  - Comentarios de `Team` y del puerto: ya no afirman lo que no se ha comprobado.
  - Skills `testing` y `tests-semanticos`: casos A–O. README: preguntas 1 y 3 al día con el alcance revisado.

**Errores y correcciones**
- En la bitácora del 2026-10-19 se escribió como hecho que la persona ya tiene la rama en Obsidian; era una
  inferencia del agente. Se corrige el texto para marcarlo como observación. Además se había añadido una nota a
  una decisión anterior del registro ("Retirado después"), lo que reescribe historial; se quita (la retirada ya
  consta en su propia entrada).

