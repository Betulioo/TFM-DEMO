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
  mis PRs activas, PR por ID, work items de la iteración actual).
- `src/adapters/azdo-source.ts`: implementación real con `AzdoReadOnlyClient` (solo GET).
  - PRs donde soy revisor: `GET {project}/_apis/git/pullrequests?searchCriteria.reviewerId={id}&searchCriteria.status=active`
  - Mis PRs: igual con `searchCriteria.creatorId={id}`. Campos: `reviewers[].vote`, `isDraft`, `creationDate`.
  - PR por ID (para PRs completadas vinculadas a tareas): `GET {project}/_apis/git/pullrequests/{id}`
- `src/adapters/fixture-source.ts`: implementación falsa que lee un JSON de fixtures con fechas controladas.

**Hecho si:** un script de prueba lista las PRs de la demo y coinciden con la web y con `demo-ids.json`.

## Paso 4.5 — Seguridad y calidad del repo (hecho)

Motivo: hoy las reglas de `CLAUDE.md` (solo lectura, capas, sin commits del agente) se cumplen por
convención; este paso las convierte en comprobaciones que fallan solas. Se hace en cuatro bloques, cada
uno verificable por separado.

### A. Arquitectura hexagonal: estructura y dirección de dependencias

Estructura objetivo (solo mover archivos y ajustar imports; sin cambiar comportamiento):

```
src/
  domain/        types.ts, rules.ts (paso 6)       → no importa nada fuera de domain/
  ports/         devops-source.ts                  → solo importa domain/
  application/   collect-snapshot.ts (paso 6)      → domain/ + ports/
  adapters/
    azdo/        read-only-client.ts, errors.ts, identity.ts, azdo-source.ts
    fixtures/    fixture-source.ts, cases.ts
  config.ts                                         → lo usan scripts/; adapters/ solo su tipo AzdoConfig
scripts/         CLI y seed: componen adaptadores; pueden importar src/
test/
```

Reglas: `src/` nunca importa `scripts/`; `domain/` no importa `node:*` ni adaptadores; solo
`adapters/azdo/read-only-client.ts` llama a `fetch`.
**Hecho si:** typecheck y tests pasan sin cambios en los tests salvo rutas de import.

### B. Lint (ESLint + typescript-eslint)

- Dependencias de desarrollo: `eslint`, `@eslint/js`, `typescript-eslint` (justificación: las reglas de
  capas y de solo lectura no se pueden comprobar con `tsc`).
- `eslint.config.js` (flat config):
  - `recommendedTypeChecked` de typescript-eslint (detecta promesas sin `await`, `any` inseguros…).
  - `no-restricted-imports` por carpeta para las reglas de capas del bloque A.
  - `no-restricted-globals` / `no-restricted-syntax`: `fetch` prohibido en `src/` salvo en el cliente de
    solo lectura.
- `npm run lint`. Se arreglan los avisos que salgan en el código actual.

**Hecho si:** `npm run lint` pasa, y un import prohibido de prueba (p. ej. `domain/` → `adapters/`) o un
`fetch` en `src/domain` hace fallar el lint.

### C. Hook pre-push sin dependencias

- `.githooks/pre-push` versionado: ejecuta `npm run typecheck && npm run lint && npm test`; si falla, no
  hay push.
- Script `"prepare": "git config core.hooksPath .githooks"` para que `npm install` lo active. Sin husky.
- Limitación: se salta con `git push --no-verify`. La comprobación que no se puede saltar es la CI del
  paso 10 (mismos comandos).

**Hecho si:** con un test roto a propósito, `git push` se detiene; con todo en verde, continúa.

### D. Salvaguardas extra

- `.claude/settings.json` del proyecto con reglas `deny` para el agente: `git commit`, `git push`, y leer
  `.env` / `.env.*`. Así la regla de `CLAUDE.md` la aplica la herramienta, no solo la instrucción.
- Seed: la confirmación pide escribir organización **y** proyecto (hoy solo el proyecto; la organización
  cambió una vez sin que se notara hasta leer la salida).
- Test del seed: que con confirmación incorrecta, proyecto no vacío o compañero sin acceso no se hace
  ninguna petición de escritura (cliente falso que registra métodos). La bitácora dice que se probó con un
  servidor falso, pero esa prueba no está en el repo.

**Hecho si:** los tests nuevos pasan y el agente recibe un rechazo al intentar `git commit`.

## Paso 5 — Work items de la iteración actual

- Iteración actual: `GET {project}/{team}/_apis/work/teamsettings/iterations?$timeframe=current`
  (el equipo es `defaultTeam` del proyecto).
- IDs de la iteración: `GET {project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/workitems`
- Detalle: `GET {project}/_apis/wit/workitems?ids=…&$expand=relations` (máximo 200 IDs por llamada).
- Categoría de estado: `GET {project}/_apis/wit/workitemtypes/{type}/states` (campo `category`).
- Filtrar por asignado al usuario (por id o uniqueName), **nunca por tipo** de work item.

**Hecho si:** salen A–G y no salen H, I ni J.

## Paso 6 — Vinculación, snapshot y tests

Alcance revisado el 2026-10-19: sin ramas, y con las PRs en las que el revisor es uno de mis equipos.

- `src/domain/rules.ts`: funciones puras para cada definición del glosario (PR pendiente de mi revisión,
  PR pendiente del equipo, bloqueada, aprobada, envejecida, tarea estancada, siguiente paso). Reciben `now` y
  los umbrales como parámetros.
- PR de una tarea: relación `ArtifactLink` con nombre "Pull Request" y URL
  `vstfs:///Git/PullRequestId/{projectId}%2F{repoId}%2F{prId}` (la API real lo devuelve con `%2f` en
  minúscula; ya se extrae en el paso 5 como `WorkItem.pullRequestIds`).
- Mis equipos: `GET _apis/projects/{project}/teams?$mine=true`. PRs del equipo:
  `GET {project}/_apis/git/pullrequests?searchCriteria.reviewerId={teamId}&searchCriteria.status=active`.
- `npm run collect` → `output/snapshot.json` con: fecha, umbrales, usuario, equipos, iteración, mis tareas (con
  PR, siguiente paso si tiene PR y si está estancada), PRs pendientes de mi revisión, PRs pendientes del equipo
  y mis PRs.
- Tests con `node:test` (`npm test`) sobre el adaptador falso cubriendo los casos A–O de
  `fixtures/expected.json`, incluidos M, N y O (solo fixtures).

**Hecho si:** `npm test` pasa con los 15 casos y el snapshot de la demo coincide con `expected.json`.

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

## Paso 8b — CLI `npm run brief` (opcional)

Un solo comando: recogida (`npm run collect`) + llamada a `claude -p` usando la skill del paso 7 + guardado del
informe en `output/brief-AAAA-MM-DD.md`.

- Verificar que la skill funciona en modo no interactivo y qué permisos necesita (lectura de
  `output/snapshot.json`, escritura del informe). Las reglas `deny` de `.claude/settings.json` siguen
  aplicando.
- Igual que la skill: solo sobre el proyecto demo o fixtures (las cuentas de IA son personales).

**Hecho si:** `npm run brief` sobre la demo genera el informe sin intervención y el verificador del paso 8
da el mismo resultado que con la skill en modo interactivo.

## Paso 8c — Integración con Obsidian por archivos (opcional)

Sin MCP: el vault es una carpeta de Markdown. Ruta en `OBSIDIAN_VAULT_PATH`.

- Guarda el informe en `Daily Brief/AAAA-MM-DD.md`.
- Crea `Tareas/WI-<id>.md` y `PRs/PR-<id>.md` con plantilla (título, enlace, sección `## Contexto`) si no
  existen. Nunca sobrescribe una nota existente.
- Lee la sección Contexto de cada nota y la incluye en el snapshot; la skill la resume junto a cada tarea o PR.
- Solo escribe en el vault; Azure DevOps sigue en solo lectura.
- Arquitectura: un puerto propio para el vault (leer contexto, crear nota, guardar informe) con adaptador de
  archivos y adaptador falso para tests; el dominio no conoce rutas.
- Riesgo a vigilar: el texto de Contexto lo escribe la persona y pasa por la IA. Con cuentas personales, el
  vault usado debe contener solo notas de la demo (misma regla que el snapshot: ningún dato de cliente).

**Hecho si:** con un vault de prueba, una ejecución crea las notas que faltan sin tocar las existentes, el
contexto escrito a mano aparece en el snapshot y en el informe, y los tests cubren el adaptador de archivos.

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
