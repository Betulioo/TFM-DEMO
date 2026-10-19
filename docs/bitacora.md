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
- [ ] 4.5. Seguridad y calidad: capas hexagonales, lint, pre-push y salvaguardas
- [ ] 5. Work items de la iteración actual
- [ ] 6. Vinculación work item ↔ rama ↔ PR, `output/snapshot.json` y tests unitarios
- [ ] 7. Skill de informe diario (Hechos / Sugerencias)
- [ ] 8. Verificador y eval: skill frente a prompt plano, mismo snapshot, chats nuevos
- [ ] 9. Medición del uso de la herramienta en la demo
- [ ] 10. CI (GitHub Actions), ADR, README final y tag `v1.0`
- [ ] 11. Cálculo de negocio (medido frente a estimado)
- [ ] 12. Documento técnico
- [ ] 13. Vídeo (opcional) y comprobación de accesos

## Próximo paso

Paso 4.5, bloque D — Salvaguardas extra (diseño en `docs/plan.md`). Bloque C hecho, pendiente de que la
persona pruebe un `git push` real. Después, el paso 5.

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
  temporal sale con 1. El `git push` real lo prueba la persona.

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
