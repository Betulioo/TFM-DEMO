# Plan de trabajo

Pasos pendientes con su diseño y su criterio de "hecho". Se trabaja **un paso cada vez**: se implementa,
se verifica (typecheck, tests y la comprobación del paso) y la persona confirma antes de pasar al
siguiente. Al cerrar un paso se actualiza `docs/bitacora.md`.

Los endpoints de la API indicados vienen de la documentación conocida de Azure DevOps 7.1, pero **no se
han probado contra la API real**: verificarlos en el paso que los use y anotar en la bitácora cualquier
diferencia.

## Paso 3 — Seed del proyecto demo (implementado, falta ejecutarlo en real)

`npm run seed:demo` sobre el proyecto demo vacío.
**Hecho si:** termina con `Seed completado.`; en Boards → Sprints → "Sprint actual" aparecen A–H y J pero
no I; en Repos → Pull requests aparecen D, E y F activas y G completada; existe `fixtures/demo-ids.json`
(se versiona: son datos ficticios).

## Paso 4 — Puerto, adaptadores y PRs

- `src/domain/types.ts`: tipos de dominio (usuario, PR, work item, snapshot). Sin nada de Azure DevOps.
- `src/ports/devops-source.ts`: interfaz `DevOpsSource` (usuario actual, PRs activas donde soy revisor,
  mis PRs activas, PR por ID, work items de la iteración actual, ramas).
- `src/adapters/azdo-source.ts`: implementación real con `AzdoReadOnlyClient` (solo GET).
  - PRs donde soy revisor: `GET {project}/_apis/git/pullrequests?searchCriteria.reviewerId={id}&searchCriteria.status=active`
  - Mis PRs: igual con `searchCriteria.creatorId={id}`. Campos: `reviewers[].vote`, `isDraft`, `creationDate`.
  - PR por ID (para PRs completadas vinculadas a tareas): `GET {project}/_apis/git/pullrequests/{id}`
- `src/adapters/fixture-source.ts`: implementación falsa que lee un JSON de fixtures con fechas controladas.

**Hecho si:** un script de prueba lista las PRs de la demo y coinciden con la web y con `demo-ids.json`.

## Paso 5 — Work items de la iteración actual

- Iteración actual: `GET {project}/{team}/_apis/work/teamsettings/iterations?$timeframe=current`
  (el equipo es `defaultTeam` del proyecto).
- IDs de la iteración: `GET {project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/workitems`
- Detalle: `GET {project}/_apis/wit/workitems?ids=…&$expand=relations` (máximo 200 IDs por llamada).
- Categoría de estado: `GET {project}/_apis/wit/workitemtypes/{type}/states` (campo `category`).
- Filtrar por asignado al usuario (por id o uniqueName), **nunca por tipo** de work item.

**Hecho si:** salen A–G y no salen H, I ni J.

## Paso 6 — Vinculación, snapshot y tests

- `src/domain/rules.ts`: funciones puras para cada definición del glosario (PR pendiente de mi revisión,
  bloqueada, aprobada, envejecida, tarea estancada, rama de una tarea, siguiente paso). Reciben `now` y
  los umbrales como parámetros.
- PR de una tarea: relación `ArtifactLink` con nombre "Pull Request" y URL
  `vstfs:///Git/PullRequestId/{projectId}%2F{repoId}%2F{prId}`.
- Ramas: `GET {project}/_apis/git/repositories/{repoId}/refs?filter=heads/` + `BRANCH_ID_PATTERN`.
- `npm run collect` → `output/snapshot.json` con: fecha, umbrales, usuario, iteración, mis tareas (con
  rama, PR, siguiente paso y si está estancada), PRs pendientes de mi revisión y mis PRs.
- Tests con `node:test` (`npm test`) sobre el adaptador falso cubriendo los casos A–N de
  `fixtures/expected.json`, incluidos M y N (fechas).

**Hecho si:** `npm test` pasa con los 14 casos y el snapshot de la demo coincide con `expected.json`.

## Paso 7 — Skill de informe diario

- `.claude/skills/daily-brief/SKILL.md`. La descripción dice qué hace y cuándo usarla; los pasos van en el cuerpo.
- Pasos: ejecutar `npm run collect`, leer solo `output/snapshot.json`, escribir `output/brief-AAAA-MM-DD.md`.
- Formato fijo: **Hechos** (PRs pendientes de mi revisión, mis PRs, mis tareas con siguiente paso, riesgos;
  siempre con ID) y **Sugerencias** (prioridad: PR envejecida pendiente de mi revisión → PRs propias
  bloqueadas → tareas estancadas → resto).
- Si falta un dato: "sin datos". Nunca escribe en Azure DevOps.

**Hecho si:** sobre la demo genera un informe legible con los IDs correctos, revisado a mano.

## Paso 8 — Verificador y eval

- `scripts/verify-brief.ts`: extrae los IDs de cada sección del informe y los compara con
  `expected.json` + `demo-ids.json` → aciertos, omisiones e inventados.
- Eval (concepto del track): mismo snapshot, chats nuevos e independientes, 3 ejecuciones de cada:
  (a) con la skill, (b) con un prompt plano ("resume mi día a partir de output/snapshot.json").
  Medir aciertos, omisiones, inventados, tiempo y tokens. Resultados en `docs/eval.md`.

## Paso 9 — Medición con la herramienta

Cronometrar 3 usos completos sobre la demo (ejecutar + leer el informe + decidir). Comparar con el tiempo
manual medido en el cliente (paso 0). Resultados en `docs/medicion.md`, separando medido de estimado.
Ningún dato del cliente pasa por la IA.

## Paso 10 — CI, ADR, README y versión

- `.github/workflows/ci.yml`: `npm ci`, typecheck, `npm test` y verificación con fixtures. Sin secretos ni red.
- `docs/adr/001-recogida-determinista.md`: por qué la IA no llama a la API.
- README final con instalación, uso, verificación y qué se reutiliza o adapta en otros proyectos.
- Tag `v1.0`.

## Pasos 11–13 — Negocio, documento y entrega

Cálculo de horas y costes (medido frente a estimado, supuestos explícitos), documento técnico con las
6 secciones del enunciado y capturas de `docs/evidencias/`, vídeo opcional y comprobación de accesos.
