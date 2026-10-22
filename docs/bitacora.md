# Bitácora del proyecto

Estado, decisiones, hechos comprobados, errores y aprendizajes. Se actualiza al terminar cada paso.
Sirve como contexto para el agente y como evidencia para el documento del TFM.

## Cómo se escribe esta bitácora

Este bloque es la única definición del formato; las skills y el CLAUDE.md enlazan aquí.

| Sección | Va aquí si… | No va aquí |
|---|---|---|
| Estado | Es el avance de un paso del plan: hecho, en curso o pendiente | Explicaciones del porqué |
| Próximo paso | Es lo concreto por lo que sigue la próxima sesión (archivo, función o comando) y las decisiones que faltan para seguir | Lo ya hecho |
| Decisiones | Se eligió entre alternativas: qué, por qué y qué se descartó | Lo que se hizo sin elegir nada |
| Hechos comprobados | Algo verificado con un comando, un test o la API real, citando cómo | Suposiciones |
| Problemas abiertos | Algo que falla o está sin resolver, con el error exacto | Cosas ya resueltas: pasan a Hechos o a Decisiones |
| Errores y correcciones | Algo que se intentó y falló: intento → por qué falló → qué cambia | Fallos aún sin resolver: van a Problemas abiertos |
| Aprendizajes | Algo que cambia cómo se trabaja a partir de ahora | Detalles de un solo paso |

En caso de duda entre dos secciones, elige una y escribe "(dudoso: X o Y)" para que la persona lo revise.

Reglas de uso:
- **Estado**, **Próximo paso** y **Problemas abiertos** son la foto vigente: se reemplazan, no se acumulan.
- **Registro**: una entrada por fecha con Decisiones, Hechos comprobados, Errores y correcciones y Aprendizajes.
  Es historial y evidencia del TFM: no se poda ni se reescribe; solo se corrige lo que sea falso o se reclasifica
  según esta tabla.
- Distingue hechos de inferencias. No escribas motivos que la persona no ha dado. Nunca tokens ni datos de cliente.

## Estado

- [ ] 0. Medir la rutina manual en el cliente (tiempos y volúmenes, sin datos)
- [x] 1. Estructura del repo, `CLAUDE.md`, README esqueleto
- [x] 2. Organización demo en Azure DevOps, tokens y `check:conn`
- [x] 3. Glosario (`docs/glosario.md`), casos sembrados (`fixtures/expected.json`) y seed
- [x] 4. Puerto, adaptador falso y adaptador Azure DevOps: PRs donde el usuario es revisor
- [x] 4.5. Seguridad y calidad: capas hexagonales, lint, pre-push y salvaguardas
- [x] 5. Work items de la iteración actual
- [x] 6. Vinculación work item ↔ PR (sin ramas), PRs del equipo, `output/snapshot.json` y tests unitarios
- [x] 7. Skill de informe diario (Hechos / Sugerencias)
- [x] 8. Verificador y eval: skill frente a prompt plano, mismo snapshot, chats nuevos
- [ ] 8b. (Opcional) CLI `npm run brief` con `claude -p`
- [ ] 8c. (Opcional) Integración con Obsidian por archivos
- [ ] 9. Medición del uso de la herramienta en la demo
- [ ] 10. CI (GitHub Actions), ADR, README final y tag `v1.0`
- [ ] 11. Cálculo de negocio (medido frente a estimado)
- [ ] 12. Documento técnico
- [ ] 13. Vídeo (opcional) y comprobación de accesos

**Paso 7, cerrado (2026-10-20).**
- Skill `.claude/skills/daily-brief/SKILL.md`: lee solo `output/snapshot.json` y escribe
  `output/brief-AAAA-MM-DD.md` con plantilla fija. La nombran `CLAUDE.md` (Arquitectura) y README (Uso,
  Estructura).
- Probada sobre fixtures y sobre la demo, con enlaces a Azure DevOps (`webUrl`), "PR propia bloqueada" y fecha en
  UTC. La persona abrió los enlaces del informe de la demo: funcionan.
- **Tarea bloqueada** (sesión aparte, antes del paso 8):
  - Término y "Motivo del bloqueo" en el glosario.
  - Regla `isBlockedTask`; `tags` y `lockReason` en `WorkItem`; `blocked` en las tareas del snapshot y
    `blockedTaskCriteria` en el snapshot.
  - Casos P y Q (fixtures) y skill (Mis tareas, Riesgos, Sugerencias).
- Commiteado por la persona (`3389820` y `ad5063e`).
- Pendiente de la persona en `.env.example` (el agente no puede leerlo):
  - Del paso 6: `AGED_PR_DAYS=3` y `STALE_TASK_DAYS=3`.
  - De la tarea bloqueada: `BLOCKED_TAG=Blocked`, `BLOCKED_STATE=Locked` y `LOCK_REASON_FIELD=`.

**Paso 8, cerrado (2026-10-21).**
- Verificador `npm run verify:brief` (`scripts/verify-brief.ts`, lógica en `scripts/lib/brief-check.ts`, 14
  tests). Probado con informes de la skill sobre la demo (A–L) y sobre fixtures (A–Q): todo coincide.
- Eval hecho y analizado en `docs/eval.md`: 3 ejecuciones con la skill y 3 con el prompt plano sobre el snapshot de
  fixtures. Informes en `output/eval/` (no se versionan).
- Parte del verificador entró en el commit `ad5063e`. El resto del paso está sin commitear: correcciones,
  documentación (README, `CLAUDE.md`, skill), `docs/eval.md` y `docs/revisiones/`.
- `revisor-tfm` al cerrar el paso (`docs/revisiones/2026-10-21.md`): sus correcciones de `docs/eval.md` están
  aplicadas. Evidencias del eval en `docs/evidencias/`, enlazadas desde `docs/eval.md` (sección Evidencias):
  capturas de los 6 informes y salidas del verificador de a-1 y b-1, hechas por la persona; tabla de uso
  `eval-uso.md`, escrita por el agente a partir de sus notas, y su captura `eval-uso.png`. `brief.png` lo borró la
  persona porque repite a-3. Commiteado por la persona (`5423694`).

**Paso 10, en curso (2026-10-22).** Adelantado por decisión de la persona, antes del 8b y del 9.
- Hecho y commiteado por la persona (`305c777`, con push; el pre-push salió en verde con 167 tests): CI `.github/workflows/ci.yml` (`npm ci`, `npm run verify`, `npm run collect -- --fixtures`;
  Node 20.19, sin secretos ni red) y `docs/adr/001-recogida-determinista.md`. README (Verificación, Estructura) y
  comentario de `.githooks/pre-push` al día. Node mínimo pasa a 20.19 (`package.json`, `package-lock.json`,
  `CLAUDE.md`, README).
- CI en verde en GitHub: ejecución `CI #1` del commit `305c777`, 37 s.
- Evidencias (capturas de la persona, sin commitear): `docs/evidencias/ci.png` (pestaña Actions, CI #1 en verde) y
  `pre-push-1.png` / `pre-push-2.png` (tests del pre-push y `git push` a `main`).
- README final, sin commitear: requisitos, instalación con la tabla de variables de `.env`, proyecto demo, uso con
  y sin Azure DevOps, tabla de verificación, dónde está la aportación, reutilización (tal cual / se configura /
  hay que adaptar) y límites.
- Falta: revisión del README por la persona y tag `v1.0` (lo pone la persona tras su commit).

## Próximo paso

**Seguir por:** el paso 8b ([`docs/plan.md`](plan.md)), en una sesión nueva: `npm run brief` = `npm run collect` +
`claude -p` con la skill `daily-brief` + guardado en `output/brief-AAAA-MM-DD.md`. Primero hay que comprobar que la
skill funciona en modo no interactivo y qué permisos necesita; las reglas `deny` siguen aplicando. El "hecho si" pide
ejecutarlo sobre la demo, y eso lo hace la persona: el agente no puede ejecutar `collect` contra la demo. Con
`-- --fixtures` sí puede probarlo él. Después, el paso 9, que necesita el paso 0 (lo mide la persona).
Antes, cerrar el paso 10: la persona revisa el README final, hace commit y pone el tag `v1.0`
(`git tag v1.0 && git push origin v1.0`). Si después cambia algo de la entrega, el tag se mueve o se crea `v1.1`.

**Decisiones pendientes**
- Si se versiona un informe de la skill sobre fixtures (p. ej. `scripts/lib/tests/data/brief-fixtures.md`) como
  dato de prueba del verificador, para cubrir el problema abierto de `renderBrief`. Propuesto por `revisor-tfm`;
  no hecho. El informe de fixtures de esta sesión está fuera del repo, en el scratchpad del agente.
- Si "PR sin revisores" pasa a ser una señal del glosario y de la skill. Los tres informes del prompt plano
  avisan de que `PR #4` no tiene revisores (cierto en el snapshot) y la skill solo dice "sin votos"
  (`docs/eval.md`, Análisis). Propuesto por el agente; no hecho.
- Nombre del siguiente paso para una PR en borrador: "PR en borrador" (frase de la persona, describe un estado)
  o una acción como los demás pasos ("Publicar la PR").
- Dos extensiones del agente sin confirmar: con varias PRs vinculadas, si la de mayor ID no se encuentra cuenta la
  mayor de las que sí existen; y una PR abandonada que era borrador da "Revisar estado".
- Si una PR deja de estar "pendiente del equipo" cuando otro miembro ya ha votado por el equipo. La definición
  actual no lo mira; falta ver en la demo qué voto muestra el equipo en ese caso.
- Si se crea el caso O en la demo a mano (PR del compañero con "TFM Demo Team" como revisor) para comprobar el
  adaptador real. El seed no puede: se niega en un proyecto con work items.
- Si las comprobaciones usadas al renombrar (textos literales sin cambios y regresión de peticiones del seed) pasan
  a ser un script del repo (`scripts/check-rename.ts`). Propuesto, no hecho.
- Si se añaden al `CLAUDE.md` las instrucciones de trabajo dadas solo en el chat (ver propuesta del traspaso).
- Si `collect` entra en la lista de scripts de solo lectura que el agente puede ejecutar contra la demo
  (`CLAUDE.md`, Arquitectura). Escribe `output/snapshot.json` en local, pero contra Azure DevOps solo lee.
- Si `test/architecture.test.ts` comprueba también la regla de `src/application` (no importa adaptadores ni
  `config.js`), que ahora solo comprueba el lint. Propuesto, no hecho.

## Problemas abiertos

Detectados, sin corregir; ninguno rompe los checks.
- `test/architecture.test.ts` no detecta `fetch` usado sin llamar directamente (`const f = fetch`) ni un `method`
  pasado en una variable; el lint sí marca cualquier uso de `fetch`. Límite no documentado en el test.
- Límites del lint (no cubiertos): `globalThis.fetch` saltaría la regla de `fetch` (`node:https` ya lo bloquea
  `NO_HTTP` en `eslint.config.js`). La garantía principal de solo lectura sigue siendo que el cliente solo tiene
  `get`. (Movido desde Aprendizajes del 2026-10-19; dudoso: Problemas abiertos o Aprendizajes.)
- `azdo-source.ts` convierte `status`, `vote` y `category` de la API con `as`, sin validar el valor.
- El paso 0 (medir la rutina manual en el cliente) sigue pendiente y lo hace la persona.
- PRs del equipo sin comprobar con datos reales: que `searchCriteria.reviewerId={teamId}` devuelva las PRs con el
  equipo como revisor, y que el revisor lleve el mismo `id` que `teams?$mine=true`. En la demo ninguna PR tiene un
  equipo como revisor.
- `myTeams()` no pagina: la API devuelve 100 equipos por defecto (según la documentación; no comprobado).
- `scripts/lib/seed.ts` escribe la duración de un día a mano (`86_400_000`) en vez de usar `MILLISECONDS_PER_DAY`
  de `src/domain/dates.ts` (DRY). Detectado en la reflexión; fuera del alcance de esta ronda.
- Lo que hay en una carpeta `tests/` de `src/` se salta las reglas de capas. Mitigado: el código de `src/` no puede
  importar de `tests/` ni de `#test-helpers` (check y lint), así que nada de ahí llega a producción.
- Tarea bloqueada sin comprobar contra el proceso del cliente: si `Locked` tiene allí categoría *Completed* o
  *Removed*, esas tareas no entran en "Mis tareas" y no salen como bloqueadas (en fixtures se supone *InProgress*).
  Si Lock reason es un campo de texto enriquecido, el motivo llega con HTML.
- El test del verificador genera su informe "correcto" con `renderBrief`, que copia la plantilla de `daily-brief`.
  Si la plantilla cambia, el test y el verificador pueden seguir de acuerdo entre sí y en verde. Ningún test usa un
  informe escrito por la skill (detectado por `revisor-tfm`, `docs/revisiones/2026-10-20.md`).
- La medida global solo reconoce `PR #n` y `WI #n`. En el eval pasó: el prompt plano sacó 0/16, 0/16 y 6/16, y
  a mano tiene 16/16 en los tres (`docs/eval.md`). Para comparar con un informe sin plantilla, hay que contar a
  mano.

## Registro

### 2026-10-19

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
  segunda cuenta. (dudoso: Decisiones o Hechos comprobados)
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
  (dudoso: Decisiones o Hechos comprobados)
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

**Hechos comprobados**
- Pasos 1 y 2: estructura del repo, organización demo, tokens y `npm run check:conn`. (dudoso: Hechos comprobados o
  Estado; no cita cómo se comprobó)
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
  necesita rama para crear una PR. `BRANCH_ID_PATTERN` fuera de `.env.example`. (dudoso: Hechos comprobados o
  Decisiones)
- Paso 6, PRs del equipo: tipo `Team`, "Mis equipos" y "PR pendiente del equipo" en el glosario,
  `isPendingTeamReview`, `myTeams()` y `pullRequestsToReviewByTeam()` en el puerto y los dos adaptadores, y el caso
  O (`verifiedIn: "fixtures"`, `reviewer: "myTeam"`). El seed lanza un error si recibe un caso con el equipo como
  revisor (no llega a pasar: salta los casos de fixtures). 8 tests nuevos. Mutación de control: quitar "no figura
  como revisor individual" hace fallar 1 test. Contra la demo: `myTeams()` devuelve "TFM Demo Team" y
  `pullRequestsToReviewByTeam()` ninguna PR. `list:prs` y `list:tasks` siguen coincidiendo con `demo-ids.json`.
- La opción de proceso solo aparece al crear el proyecto (desplegable *Advanced*). (Movido desde Aprendizajes.)
- Endpoints del paso 5 probados ya contra la API real y coinciden con `docs/plan.md`:
  `teamsettings/iterations?$timeframe=current` devuelve el sprint actual; `iterations/{id}/workitems`
  devuelve los IDs en `workItemRelations[].target.id` (el plan no indicaba la forma de la respuesta).
  (Movido desde Aprendizajes.)
- Endpoints del paso 4 probados contra la API real y coinciden con `docs/plan.md`: listado de PRs con
  `searchCriteria.reviewerId` / `searchCriteria.creatorId` + `searchCriteria.status=active`, y
  `{project}/_apis/git/pullrequests/{id}` para una PR completada. No se ha probado la paginación real
  (`$top`/`$skip`): la demo tiene menos de 100 PRs; solo está cubierta por un test con lector falso.
  (Movido desde Aprendizajes.)
- API real, paso 5 (2026-10-19): el `id` de `connectionData` coincide con `System.AssignedTo.id`;
  `$expand=relations` no se puede combinar con `fields` (400); el endpoint de estados devuelve `category`, que
  **depende del tipo** (Agile: `Resolved` es InProgress en User Story y Resolved en Bug; Bug no tiene
  `Removed`); el enlace a PR usa `%2f` en minúscula. Todo lo demás coincide con `docs/plan.md`.
  (Movido desde Aprendizajes.)
- API real, ramas (2026-10-19): `_apis/git/repositories` devuelve `isDisabled` en cada repositorio (la demo tiene
  uno, `TFM Demo`); `refs?filter=heads/` devuelve `{ value, count }` con `name` (`refs/heads/…`), `objectId`,
  `creator` y `url`. La rama de G sigue existiendo aunque su PR está completada. Sin paginar: con 8 ramas no se ha
  comprobado qué pasa con muchas (según la documentación, la API pagina con `$top` y `continuationToken`; no comprobado, y el cliente no lo lee).
  (Movido desde Aprendizajes.)
- API real, equipos (2026-10-19): `_apis/projects/{project}/teams?$mine=true` funciona con el token de lectura y
  devuelve `id`, `name`, `description`, `identityUrl`… El `id` del equipo es el de su identidad. En la demo ninguna
  PR tiene un equipo como revisor: los revisores individuales vienen sin `isContainer`. (Movido desde Aprendizajes.)

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
- La bitácora decía que las salvaguardas del seed se habían probado con un servidor falso, pero esa prueba
  no estaba en el repo. Ahora sí: `test/seed.test.ts`. (Movido desde Aprendizajes.)
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

**Aprendizajes**
- El material del track (`docs/contexto-track.md`) prohíbe usar cuentas personales con datos de
  cliente. Se detectó antes de construir, lo que evitó rehacer el paso 9.
- Límites de las reglas `deny`: bloquean las herramientas del agente, pero un comando de shell distinto
  (p. ej. `cat .env`) no queda cubierto por `Read(./.env)`. Son una capa más, no una garantía.

### 2026-10-20

**Decisiones**
- ISSUE-11: de las dos opciones propuestas (fusionar o separar cómo y qué), la persona eligió separar.
- Se dejan para el paso 10: la CI que ejecute `npm run verify`, con lint (ISSUE-6 y O-5), y que compruebe los
  commits que se suben en vez del árbol de trabajo, como hace el pre-push (ISSUE-12).
- Limitaciones documentadas, sin arreglo: los `deny` son patrones de prefijo, así que otras formas de git
  (`git -C . commit`) o de leer `.env` no quedan bloqueadas (ISSUE-13; inferencia, no probado). En esta ronda no
  se añaden hooks: `Stop` descartado por la persona; `PreToolUse` (para `.env` e ISSUE-13) queda para más adelante.
- Para ISSUE-13 la persona elige añadir al `deny` `Bash(git -C * commit *)` y `Bash(git -C * push *)`, y dejar
  el hook `PreToolUse` para más adelante. Con los patrones nuevos, `git -C . commit --dry-run` y
  `git -C . push --dry-run` quedan denegados. Siguen sin cubrir formas como `git -c x=y commit` o
  `sh -c "git commit"` (inferencia por la forma del patrón; no probado). (Movido desde Aprendizajes.)
- `nextStep` recibe la PR de la tarea ya elegida (o `undefined`), no el work item con todas sus PRs: elegir la
  PR es la vinculación, que va aparte. Decisión del agente; la persona puede revisarla.
- Una PR en borrador cae en "Revisar estado": no es PR activa, así que no cumple las reglas 2–4. (Corregido en la
  reflexión: es una decisión del agente, no confirmada; pasa a Decisiones pendientes.)
- "PR de una tarea": si hay varias, la más reciente es la de **mayor ID** (decisión de la persona). Glosario
  actualizado; regla `taskPullRequestId` en `src/domain/rules.ts` con 3 tests.
- Tests junto al código que prueban, en carpetas `tests/` (`src/domain/tests/rules.test.ts`), con `describe` por
  término del glosario, `it` por caso y AAA siempre separado sin comentarios (decisiones de la persona). Por ahora
  solo `rules.test.ts`; los otros 5 archivos de `test/` siguen con `test()`. Helpers locales; si tests de carpetas
  distintas comparten uno, sale a una carpeta de helpers.
- Consecuencia: las carpetas `tests/` de `src/` quedan fuera de las reglas de capas (necesitan `node:test` y
  `node:assert`). Cambiado en `CLAUDE.md`, `eslint.config.js` (`ignores` en `layer()` y `TEST_FILES` para las reglas
  de tests) y `test/architecture.test.ts` (`isTestFile`, con test de control). `npm test` añade
  `src/*/tests/*.test.ts`, glob de la shell y no de Node, porque Node 20 no acepta globs en `--test` (según la
  documentación de Node; no probado); solo llega a un nivel bajo `src/` (p. ej. `src/adapters/azdo/tests/` no
  entraría).
- Decisiones de la persona sobre el siguiente paso, tras explicarle las dos preguntas pendientes:
  - "si una tarea tiene una PR en borrador, debería decir que la PR está en borrador": nuevo siguiente paso
    **PR en borrador** (regla 2, después de "Cerrar la tarea"); nuevo término "PR en borrador" en el glosario y
    "PR activa" ya no dice que el borrador no cuenta "para nada". Una PR abandonada que era borrador sigue en
    "Revisar estado".
  - "si una tarea con una PR vinculada no se encuentra, no debería decir ni aparecer nada, como si no tuviese PR
    vinculada": la PR que no se encuentra se ignora. Extensión del agente para varias PRs: cuenta la de mayor ID
    entre las que sí existen. `taskPullRequestId(workItem)` pasa a `taskPullRequest(linkedPullRequests)`, que recibe
    las PRs ya buscadas (`undefined` si no se encontró), para que la regla esté en el dominio y tenga tests.
- Errores recurrentes detectados por `/reflect` en tres turnos seguidos: implementar sin confirmación, interpretar
  al pie de la letra sin preguntar, presentar huecos como opcionales y clasificar mal la bitácora. Decisión de la
  persona: se corrigen con el modo plan, impuesto por la herramienta (`"defaultMode": "plan"` en
  `.claude/settings.json`), y con criterios explícitos (`CLAUDE.md`, "Criterios"; formato de la bitácora en
  "Cómo se escribe esta bitácora"), no con más órdenes.
- Reclasificación de la bitácora según la tabla nueva (opciones de la persona): se mantienen las fechas del
  Registro y la tabla gana las filas "Próximo paso" y "Errores y correcciones". Descartado repartir todo en
  secciones globales sin fechas, porque se perdería cuándo pasó cada cosa. "Progreso" desaparece: sus puntos pasan a
  Hechos comprobados (o a Estado); los que no citan cómo se comprobaron llevan "(dudoso)". Las "Decisiones
  pendientes" van en Próximo paso (lectura del agente: son lo que falta decidir para seguir).
- Snapshot (decisiones del agente, aprobadas en el plan de la sesión): cada PR lleva ya calculadas `aged`,
  `blocked` y `approved`; cada tarea es su work item con `pullRequest`, `nextStep` y `stale`; un dato que falta
  va como `null`. Para no repetir PRs, se juntan las de "soy revisor" y las de cada equipo, se quitan las
  repetidas por ID y se clasifican con las reglas: "pendiente de mi revisión" y "pendiente del equipo" son
  excluyentes por definición, así que una PR no sale en las dos listas. Mis PRs se filtran con `isActive`
  (glosario: "PRs activas"), así que las de borrador no aparecen.
- La comprobación snapshot ↔ `expected` vive en `scripts/lib/snapshot-check.ts` y la usan `npm run collect`
  (demo, IDs de `demo-ids.json`) y su test (fixtures), para no duplicarla. Una clave de `expected` sin comprobación
  definida cuenta como fallo, para que un caso nuevo no pase sin comprobarse.
- Umbrales: `loadThresholds()` carga `.env` y llama a `thresholdsFrom(environment)`, que es pura y se prueba sin
  `.env`. Sin valor, 3 días (glosario); un valor que no es entero ≥ 1 es un error. Decisión del agente fuera del
  plan aprobado (el plan decía solo `loadThresholds()` con `optionalEnv`); se avisó después, no antes.
- Tras el reflect del cierre del paso 6, la persona pidió aplicar las seis propuestas del agente ("aplica tú las
  opciones que propones"): categoría "Incumplimiento" y criterio "Desviación del plan aprobado" en `CLAUDE.md`
  (Criterios); regla de lint `no-non-null-assertion`; "Límites del agente en este entorno" en `CLAUDE.md` (Reglas);
  la skill `testing` remite a `package.json` en vez de copiar los patrones de `npm test`; "Al editar" en `CLAUDE.md`
  (Edit tras leer; copia en vez de `git checkout`) y `deny` de `Bash(git checkout *)` y `Bash(git restore *)`.
  `git restore` lo añadió el agente porque descarta cambios igual que `git checkout`.
- Orden (opción de la persona): esperar a su commit del paso 6 (`327cf49`) antes de aplicarlas, para no mezclar
  cambios con los de la otra sesión. Descartado aplicarlas encima de sus cambios sin commitear o dejar `verify` en
  rojo hasta que esa sesión quitara sus `!`.
- Paso 7: el plan dice que la skill ejecuta `npm run collect`, pero `CLAUDE.md` no deja al agente ejecutarlo
  contra la demo. Opción de la persona: la skill pide a la persona que lo ejecute (o usa `-- --fixtures` para
  probar). Descartado añadir `collect` a los scripts de solo lectura del agente (sigue en Decisiones pendientes).
- Paso 7 (decisiones del agente, aprobadas en el plan de la sesión): la skill copia las señales ya calculadas del
  snapshot y no las recalcula; encabezados fijos para el verificador del paso 8; se añade la sección "PRs
  pendientes del equipo", que la lista de Hechos del plan no nombra pero existe en el glosario y el snapshot desde
  el paso 6; lista vacía → "Ninguna.", y `pullRequest: null` en una tarea es "sin PR", no "sin datos".
- Cierre del paso 7 (decisiones de la persona tras revisar el informe):
  - "me gustaría que también dejara los links a las tareas y PRs": cada ID del informe va enlazado. Como la skill
    no llama a la API, el adaptador pone `webUrl` en `PullRequest` y `WorkItem` (dominio) y el snapshot lo hereda.
    Real: `{orgUrl}/{proyecto}/_git/{repositorio}/pullrequest/{id}` y `{orgUrl}/{proyecto}/_workitems/edit/{id}`,
    con proyecto y repositorio codificados; `AzdoSource` recibe `orgUrl`. Falso: dominio reservado
    `fixture.invalid`. Si falta `webUrl`, la skill pone el ID sin enlace y no construye la URL. Descartado que la
    skill construya las URLs a partir de una base: necesitaría el repositorio de cada PR.
  - "PR bloqueada" de Mis PRs va en Riesgos: nuevo término "PR propia bloqueada" en "Señales de riesgo".
  - La fecha del informe queda en UTC (`generatedAt` tal cual); la limitación de 00:00–02:00 en España se
    documenta en la skill.
  - "¿También dice si una tarea está bloqueada?": hoy no (el glosario no tiene "tarea bloqueada"; si su PR es una
    PR bloqueada, sale "Atender cambios solicitados"). La persona quiere la marca de Azure DevOps, la etiqueta
    `Blocked`, en una sesión aparte.
- Tarea bloqueada (sesión aparte; decisiones de la persona en modo plan):
  - En el proyecto real hay dos marcas: una etiqueta ("bloqueada" en el cliente) y el estado `Locked`, con un
    campo personalizado "Lock reason". **Tarea bloqueada** = tarea de "Mis tareas" con la etiqueta o con el
    estado. Descartados: solo el estado y dos términos distintos.
  - Etiqueta y estado configurables en `.env` (`BLOCKED_TAG`, por defecto `Blocked`; `BLOCKED_STATE`, por defecto
    `Locked`), porque los nombres del cliente no son los de la demo. Primero se había elegido la etiqueta fija; se
    cambió al conocer la etiqueta del cliente.
  - El motivo se lee de un campo cuyo nombre de referencia va en `.env` (`LOCK_REASON_FIELD`); sin él, "sin
    datos". Descartado fijar el nombre en el código.
  - Es señal de riesgo: va en Riesgos y en las Sugerencias, después de "PR propia bloqueada" y antes de "tarea
    estancada" (`docs/plan.md`, paso 7).
  - Casos P (etiqueta) y Q (estado `Locked` con motivo) solo en fixtures: la demo es Agile, sin `Locked` ni Lock
    reason, y el seed se niega en un proyecto con work items. `validateCases` rechaza esos datos fuera de fixtures.
  - El dominio recibe `tags` (lista) y la regla vive en `rules.ts`, no en los adaptadores. La etiqueta se compara
    entera y sin distinguir mayúsculas, porque el seed ya pone `tfm-seed` en `System.Tags`.
- Skills de sesión y de revisión (la persona preguntó si mantener o fusionar `revisar-tfm` y `traspaso-sesion`,
  que no usa):
  - Se borra `traspaso-sesion`: sus pasos ya los pide la lista de cierre de `CLAUDE.md`. Sus dos aportes propios
    pasan al `CLAUDE.md`: proponer instrucciones dadas solo en el chat (punto 3 de la lista de cierre) y el modo
    "el contexto está fallando" (sección Contexto). Descartado fusionarla con `iniciar-sesion`: se usan en
    sesiones distintas, una escribe la bitácora y la otra la lee.
  - Se mantienen `revisar-tfm` y el agente `revisor-tfm`, sin fusionar con `/reflect`: `/reflect` revisa el
    trabajo del turno con el contexto del chat; `revisor-tfm` revisa el repositorio entero frente a `docs/plan.md`
    y `docs/enunciado-tfm.md`, aislado. Solo él comprueba el enunciado. `CLAUDE.md` dice ahora cuándo usar cada uno.

**Hechos comprobados**
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
- Auditoría del arnés (`harness-audit` v0.57.1; informe en `harness-audits/2026-10-20.md`): 13 problemas (3 altos,
  5 medios, 5 bajos) y 7 observaciones. Arreglado, con las decisiones de la persona (dudoso: Hechos comprobados o
  Decisiones):
  - ISSUE-1: al terminar un paso manda la lista de cierre de `CLAUDE.md` (corregir); `traspaso-sesion` solo
    registra cuando se usa porque el contexto falla. Cada archivo lo dice y enlaza al otro.
  - ISSUE-2: `docs/enunciados-tfm.md` renombrado a `docs/enunciado-tfm.md`, la ruta que cita `revisar-tfm`.
  - ISSUE-3: el agente `revisor-tfm` tiene `Write` y el check de arquitectura en su lista de Bash.
  - ISSUE-4: `npm run verify` (typecheck + lint + test) en `package.json`; lo usan el pre-push, la lista de cierre
    y las skills `iniciar-sesion` y `traspaso-sesion`. Sin hook `Stop`.
  - ISSUE-5: "nunca llama a la API" se acota a la skill de síntesis; el agente de desarrollo puede ejecutar los
    scripts de solo lectura contra la demo. "Ningún dato de cliente pasa por la IA" pasa a práctica explícita.
    Regla de lint contra `new Date()` sin argumentos en `test/`.
  - ISSUE-7 y 11: `revisar-tfm` sigue si falta un archivo y lo dice al principio del resultado; su descripción
    pide preferir el agente `revisor-tfm` para no llenar el contexto.
  - ISSUE-8: `deny` de `Read(./.env.*)`, `Bash(cat .env*)`, `Bash(source .env*)` y `Bash(grep * .env*)`;
    `CLAUDE.md` copia la lista real.
  - ISSUE-9: `CLAUDE.md` remite a `iniciar-sesion` al empezar; quitadas las repeticiones de "no commits" y de
    "checks en verde".
  - ISSUE-10: Estado del paso 6 sin ramas y README (Uso y Estructura) al día; el punto 4 de la lista de cierre
    pide comprobar que el Estado y el README siguen siendo ciertos.
  - ISSUE-11: `testing` queda con el cómo y enlaza `tests-semanticos` para el qué. Cierra el problema abierto
    del solapamiento entre las dos skills.
  - O-6: `.claude/skills/harness-audit-pape/` en `.gitignore`.
- Paso 6: reglas "tarea estancada" (`isStale`) y "siguiente paso" (`nextStep`) en `src/domain/rules.ts`, y tipo
  `NextStep` en `src/domain/types.ts` con los nombres del glosario. 11 tests nuevos en `test/rules.test.ts`: caso N,
  límites de 2, 3 y 4 días, umbral configurable, solo *InProgress*, casos D–G, tarea sin PR, PR abandonada o en
  borrador y orden de las reglas. `npm run verify` en verde (76/76).
- Los otros 5 archivos de test, al mismo estilo (pedido por la persona): `azdo-source` → `src/adapters/azdo/tests/`,
  `cases` y `fixture-source` → `src/adapters/fixtures/tests/`, `seed` → `scripts/lib/tests/`; `architecture.test.ts`
  se queda en `test/` porque comprueba todo `src/`, no un módulo. `npm test` añade `src/*/*/tests/` y
  `scripts/*/tests/`; `TEST_FILES` del lint, `scripts/**/tests/**`. Se parten en dos los tests que comprobaban dos
  comportamientos (equipo como revisor en fixtures / en la demo, PR de G / PR inexistente, antigüedad de N / PR de
  G, import válido en el control de dominio): de 80 a 84 tests. `numbersFrom` (azdo-source) y `listOf` (seed)
  hacían lo mismo y `NOW` estaba repetido: pasan a `test/helpers/test-data.ts`. (Movido desde Decisiones.)
- Reflexión sobre la ronda (`/reflect`) y correcciones pedidas por la persona ("corrijamos, y apliquemos todas las
  posibles mejoras"). (Movido desde Decisiones.)
  - Mutaciones de las reglas nuevas: `isStale` sin filtro *InProgress* o con umbral +1, `taskPullRequestId` con la
    primera PR, `nextStep` sin la regla 1 o sin la 2 → cada una hace fallar al menos un test.
  - Test nuevo con el adaptador falso: siguiente paso de mis tareas y tareas estancadas comparados con
    `expected.json` (leído, no copiado). Detecta las mutaciones de `taskPullRequestId` y de `isStale`.
  - AAA: la acción es la llamada que se prueba; los `find` sobre el resultado pasan a la comprobación. Partidos los
    tests con dos comportamientos que quedaban (petición / traducción en PRs, iteración y equipos; asignación / PRs
    vinculadas; lotes / parámetros de detalle; iteración / work items en el adaptador falso).
  - `hasNoVotes` → `isActiveWithoutVotes`. `NOW` compartido → `NOW_ISO` y un `Date` por archivo
    (`rules.test.ts` tenía aún su propio literal). Alias `#test-helpers/*` en `package.json` (`imports`) en vez de
    `../../../../test/helpers`; `tsconfig.json` necesita `rootDir: "."` para resolverlo.
  - `runSeed` recibe `print` como dependencia: los tests pasan `print() {}` y la salida de `npm test` queda limpia.
  - Regla nueva de arquitectura: el código de `src/` no importa de carpetas `tests/` ni de `#test-helpers`
    (`CLAUDE.md`, check con control y lint, probado con un archivo temporal ya borrado).
  - `test/test-discovery.test.ts`: falla si algún `*.test.ts` del repo no entra en los patrones de `npm test`
    (probado con un test temporal en `src/adapters/azdo/tmpdeep/tests/`, ya borrado).
  - Riesgo de git (renombrados en el índice y `test/helpers/` sin seguimiento): resuelto, el commit `ab04ea8` de la
    persona incluye `test/helpers/test-data.ts`.
- Siguiente paso "PR en borrador" y PRs no encontradas: 3 tests nuevos (borrador con y sin votos, no encontrada
  entre otras, ninguna encontrada) y el de abandonada separado; el test con `expected.json` busca todas las PRs
  vinculadas. 99/99. (Separado de la decisión correspondiente.)
- Mutante equivalente: quitar la condición de votos de `isActiveWithoutVotes` no hace fallar ningún test, y no
  puede: una PR activa con algún voto distinto de 0 ya es aprobada o bloqueada (reglas 2 y 3). Se deja la condición
  porque refleja la definición del glosario ("PR activa sin votos"); quitar la de `isActive` sí falla.
  (Movido desde Aprendizajes.)
- Mutante equivalente en `taskPullRequest`: sin el filtro de `undefined` los tests siguen pasando, porque
  `Array.sort` coloca los `undefined` al final sin llamar al comparador. Se deja el filtro: hace explícita la regla.
  Quitar la regla del borrador sí hace fallar su test. (Movido desde Aprendizajes.)
- En `no-restricted-imports`, un patrón `group` sigue la sintaxis de `.gitignore` y `#` empieza un comentario:
  `"#test-helpers/*"` no prohibía nada (comprobado con un archivo temporal). Con `regex` sí. (Movido desde
  Aprendizajes; dudoso: Hechos comprobados o Aprendizajes.)
- TypeScript (NodeNext) resuelve el campo `imports` de `package.json` solo con `rootDir` (error TS2210 sin él).
  (Movido desde Aprendizajes.)
- Mutación de control: sin `isTestFile` en `sourceFiles`, el check de arquitectura falla con
  `src/domain/tests/rules.test.ts importa node:test` y `node:assert/strict`; con él, pasa. (Movido desde
  Aprendizajes.)
- La regla `no-restricted-syntax` con `NewExpression[callee.name='Date'][arguments.length=0]` marca `new Date()`
  y no `new Date("2026-10-19T09:00:00Z")`: comprobado con un archivo temporal en `test/` (1 error, en la línea de
  `new Date()`), borrado después. (Movido desde Aprendizajes.)
- Inferencia, no probada: `Read(./.env.*)` y `Bash(cat .env*)` también deberían bloquear `.env.example`, así que
  el agente no podría leer la plantilla. (Movido desde Aprendizajes; dudoso: era una inferencia, la confirma el
  punto siguiente.)
- Pruebas de los `deny` (con la salida a `/dev/null` para que un fallo no imprimiera el token):
  `cat .env` denegado; `cat .env.example` también denegado, lo que confirma la inferencia anterior;
  `git -C . commit --dry-run` **no** se bloqueó (se ejecutó sin crear commit), lo que confirma ISSUE-13.
  La persona acepta que el agente no lea `.env.example`: si hace falta, la persona la pega. (Movido desde
  Aprendizajes.)
- Recogida (paso 6): `npm run verify` en verde, 129/129. Con el adaptador falso, los 15 casos A–O coinciden con
  `expected.json` (`scripts/lib/tests/snapshot-check.test.ts`, un test por caso más dos de control). Mutación:
  cambiar en `nextStep` "Completar la PR" por "Esperar revisión" hace fallar solo el caso F; deshecha.
  `npm run collect -- --fixtures` escribe `output/snapshot.json` con 8 tareas, 2 PRs pendientes de mi revisión,
  1 del equipo y 3 mías.
- `npm run collect` contra la demo (lo ejecutó la persona): 7 tareas, 1 PR pendiente de mi revisión, 0 del equipo
  y 3 mías; las 27 comprobaciones de A–L en `OK` ("Todo coincide"). M, N y O no existen en la demo.
- `no-non-null-assertion` encontró 8 `!` (`npx eslint . --rule …`): 2 en `scripts/lib/seed.ts`, 2 en
  `scripts/lib/tests/snapshot-check.test.ts`, 2 en `azdo-source.test.ts`, 1 en `fixture-source.test.ts` y 1 en
  `test/architecture.test.ts`. Sustituidos por comprobaciones con error explicado (`caseByKey`, `requestedIds`) o
  por el tipo ya acotado. Un archivo temporal con `values[0]!` falla el lint (borrado después). `npm run verify`
  en verde (129/129).
- Correcciones del reflect del cierre del paso 6 (pedidas por la persona; clasificadas como hueco e
  incumplimientos según los Criterios de `CLAUDE.md`):
  - Hueco (glosario: umbrales configurables): 2 tests nuevos en `src/application/tests/collect-snapshot.test.ts`
    con `{ agedPrDays: 5, staleTaskDays: 2 }`. Mutaciones sobre una copia de `collect-snapshot.ts`, restaurada
    desde la copia: intercambiar los umbrales hace fallar los 2 tests; un 3 fijo en `isAged` e `isStale`, también.
  - DRY: `DEFAULT_THRESHOLDS` exportado de `src/config.ts` y usado en los 4 archivos de test que repetían el 3;
    `fixtureCaseIds` en `fixture-source.ts`, que el adaptador usa para las PRs vinculadas y el test de casos
    reutiliza; `optionalEnv(name, environment)` reutilizado por `thresholdDays`.
  - Glosario: dos constantes por defecto (`DEFAULT_AGED_PR_DAYS`, `DEFAULT_STALE_TASK_DAYS`) en vez de una.
  - Skill `testing` (un test por comportamiento): "con varias PRs vinculadas…" separado en dos tests.
  - Ambigüedad resuelta por la persona: el comentario de `Snapshot` dice que "sin datos" es `null` o un campo
    ausente; la skill del paso 7 debe tratar los dos igual. No cambia el JSON.
  - `npm run verify` en verde (132/132).
- Skill `daily-brief` probada en la misma sesión que la escribió (no en un chat nuevo): sobre el snapshot de
  `npm run collect -- --fixtures`, el informe pone PR #11 y #13 en "pendientes de mi revisión" (#13 envejecida),
  PR #15 en "del equipo", PR #4/#5/#6 en "Mis PRs" (sin votos / bloqueada / aprobada), WI #101–107 y #114 con sus
  siguientes pasos y WI #114 estancada; comparado a mano con `expected.json`, los 15 casos coinciden. Sin
  "PR en borrador": ningún caso de fixtures la tiene en "Mis tareas".
- `npm run collect` contra la demo (lo ejecutó la persona, 27 comprobaciones A–L en `OK`) y skill `daily-brief` en
  la misma sesión: el informe tiene 1 PR pendiente de mi revisión (PR #6), 0 del equipo, 3 mías (PR #4 aprobada,
  #3 bloqueada, #2 sin votos), 7 tareas (WI #6–12) y 1 riesgo (PR #3). Revisión a mano de la persona pendiente.
- Cruce del agente entre ese informe y `fixtures/demo-ids.json`: WI #6–12 son A–G y H, I, J (WI #13–15) no salen;
  PR #6 (K) está pendiente de mi revisión y PR #7 (L) no sale; Mis PRs: PR #2 (D) sin votos, #3 (E) bloqueada,
  #4 (F) aprobada; WI #12 (G) con "Cerrar la tarea" por su PR #5. Coincide con `expected.json` en A–L.
- Correcciones del reflect del paso 7 (pedidas por la persona: "aplica"): quitada de la skill la regla "Mis PRs
  con `isDraft` → PR en borrador", que contradecía al snapshot (Mis PRs ya excluye los borradores) y al glosario;
  la plantilla usa marcadores `PR #<id>` / `WI #<id>` en vez de IDs de ejemplo, para que no se copien al informe.
- Revisión a mano de la persona de `output/brief-2026-10-20.md` (demo): se lee bien y los IDs coinciden con
  `fixtures/demo-ids.json` en A–L.
- Enlaces (`webUrl`): 2 tests nuevos en `src/adapters/azdo/tests/azdo-source.test.ts` (PR con proyecto y
  repositorio con espacios codificados; work item a `_workitems/edit/{id}`), y el de traducción de PRs incluye la
  URL. Mutación sobre una copia, restaurada desde la copia: sin `encodeURIComponent` en el repositorio fallan 2
  tests. `npm run verify` en verde (134/134). Con el adaptador falso en memoria (sin escribir en `output/`), las 8
  tareas y las 6 PRs llevan su URL de `fixture.invalid`. `npm run list:prs` y `list:tasks` contra la demo siguen
  en "Todo coincide", así que la respuesta de PRs trae `repository` (si no, `toPullRequest` fallaría al leer
  `repository.name`). Tras un nuevo `npm run collect` de la persona (27 comprobaciones A–L en `OK`), el agente
  regeneró `output/brief-2026-10-20.md` con la skill: 1 PR pendiente de mi revisión, 0 del equipo, 3 mías, 7 tareas
  y 1 riesgo (PR #3, PR propia bloqueada), todos los IDs enlazados. Pendiente: que la persona abra los enlaces.
- Tarea bloqueada: `npm run verify` en verde (153/153; antes 134). Mutaciones de control sobre una copia de
  `rules.ts`, restaurada desde la copia:
  - Si `isBlockedTask` ignora el estado, fallan el caso Q y 2 tests de la regla.
  - Si ignora la etiqueta, fallan el caso P, el test de criterios de la recogida y 2 tests de la regla.

  Con `npm run collect -- --fixtures`, WI #116 (P, etiqueta `Blocked`) y WI #117 (Q, `Locked`, con motivo) salen
  con `blocked: true`, y el snapshot lleva `blockedTaskCriteria`.
- Tarea bloqueada contra la demo: en el `npm run collect` de la persona salen 27 comprobaciones A–L en `OK`.
  Las 7 tareas llegan con `tags: ["tfm-seed"]` (la etiqueta del seed, leída de la API real) y `blocked: false`.
  Sin comprobar contra la API real: una tarea con la etiqueta `Blocked` (en la demo no hay ninguna) y el campo del
  motivo (la demo no lo tiene); solo están probados con el lector falso. Con ese snapshot, el agente regeneró
  `output/brief-2026-10-20.md` con la skill (`/daily-brief` de la persona). Tiene la línea nueva "Tarea bloqueada:
  etiqueta Blocked o estado Locked", 1 PR pendiente de mi revisión, 0 del equipo, 3 mías, 7 tareas y 1 riesgo
  (PR #3, PR propia bloqueada); ninguna tarea bloqueada.
- Cierre del paso 7: la persona abrió los enlaces del informe de la demo y todos funcionan (lo dice ella; el
  agente no puede abrirlos).

**Errores y correcciones**
- Comentario `/** … src/**/tests/ … */` en `test/architecture.test.ts` → el `*/` de `**/` cerró el comentario y el
  typecheck falló con decenas de errores → reescrito sin `**/`. (Estaba en Aprendizajes; movido aquí en la reflexión.)
- Al reordenar un test del adaptador falso en AAA, `iteration.id` dejó de compilar (antes lo acotaba el
  `assert.equal` previo) → se usó `iteration!` → en la reflexión se parte el test y usa el helper
  `currentIterationWorkItems`.
- La regla de lint contra imports de tests usaba `group` con `#test-helpers/*` → no detectaba el alias (ver
  Hechos comprobados) → pasa a `regex`.
- En la bitácora del 2026-10-19 se escribió como hecho que la persona ya tiene la rama en Obsidian; era una
  inferencia del agente. Se corrige el texto para marcarlo como observación. Además se había añadido una nota a
  una decisión anterior del registro ("Retirado después"), lo que reescribe historial; se quita (la retirada ya
  consta en su propia entrada).
- Bitácora mal clasificada en tres turnos seguidos (avances en Decisiones, errores en Aprendizajes) → no había un
  criterio escrito de qué va en cada sección, solo los nombres → bloque "Cómo se escribe esta bitácora" con la
  tabla y reclasificación de todas las entradas.
- El primer test de los umbrales cambiaba `process.env` y llamaba a `loadThresholds()`, que carga `.env` → el
  proceso de tests habría cargado los tokens, aunque los tests no deben usar `.env` (skill `testing`) → se separa
  `thresholdsFrom(environment)` y el test le pasa un objeto. No llegó a ejecutarse: se vio antes de lanzar los
  tests. (dudoso: Errores y correcciones o Decisiones)
- El primer test de que la recogida usa los umbrales ponía una tarea de 4 días con `staleTaskDays: 2` → con un 3
  fijo en `isStale` la tarea seguía estancada y el test pasaba (mutación) → la tarea pasa a 2 días, que solo está
  estancada con el umbral 2.
- Paso 7: la prueba con `npm run collect -- --fixtures` sobrescribió el `output/snapshot.json` de la demo, y luego
  el informe de la demo sobrescribió el de fixtures (los dos son `brief-2026-10-20.md`); se avisó después, no
  antes → se perdió el informe de fixtures (queda su resumen aquí) → antes de sobrescribir algo en `output/`, el
  agente avisa. El snapshot no dice si viene de fixtures o de la demo (propuesto un campo `source`; opcional).
- Paso 7: tras el `npm run collect` de la persona, el agente generó el informe de la demo sin contarlo antes
  ("Antes de implementar", `CLAUDE.md`) y en contra de lo que había escrito ("en una sesión nueva"); la acción
  admitía dos lecturas y había que preguntar (Criterios, "Ambigüedad"). Detectado en el reflect.
- Tarea bloqueada: la verificación del plan aprobado ejecutó `npm run collect -- --fixtures` sin avisar antes de
  que sobrescribía el `output/snapshot.json` de la demo, en contra de lo aprendido arriba ("antes de sobrescribir
  algo en `output/`, el agente avisa") → hay que repetir `npm run collect` sobre la demo para cerrar el paso 7.
  Que se repita apoya pasarlo a una regla comprobable: el campo `source` propuesto, o que `--fixtures` escriba
  en otro archivo (opcional, sin hacer).
- Tarea bloqueada: fuera del plan aprobado y avisado después, no antes ("Desviación del plan aprobado"):
  - `AGILE_CATEGORIES` pasa a llamarse `STATE_CATEGORIES` en el adaptador falso, porque ahora incluye `Locked`,
    que no es de Agile.
  - Se amplía la descripción de `verifiedIn.fixtures` en `expected.json`.
- Primera revisión con `revisor-tfm`: el informe salió en español, pero el agente devolvió el resumen en inglés y
  el agente principal lo pasó a la persona sin traducir. Ninguna regla pedía español fuera del código y los
  comentarios → `CLAUDE.md` (Convenciones) pide ahora español en todo, incluidos los subagentes, y
  `revisor-tfm` pide el resumen en español.

**Aprendizajes**
- Los errores recurrentes del agente se corrigen con límites que impone la herramienta (modo plan) y con criterios
  con definición (hueco frente a opcional, ambigüedad, tabla de la bitácora), no con más órdenes (decisión de la
  persona). Hecho comprobable que lo apoya: `CLAUDE.md` ya decía "No amplíes el alcance sin avisar" y el agente
  amplió el alcance en varios turnos de este día.
- El reflect del cierre del paso 6 mostró que el modo plan controla el inicio pero no las desviaciones a mitad de
  ejecución (`thresholdsFrom` y un patrón nuevo de `npm test`, avisados después), y que "Hueco frente a opcional"
  dejaba fuera las reglas de `CLAUDE.md` y de las skills (DRY o "un test, una comprobación" salieron como
  opcionales). Por eso se añaden "Desviación del plan aprobado" e "Incumplimiento".
- Una corrección anotada en la bitácora no impide que se repita (`iteration!` volvió a aparecer): lo que se repite
  pasa al lint. Y un dato copiado en dos sitios acaba siendo falso en uno (patrones de `npm test` en la skill
  `testing`): se enlaza a la fuente en vez de copiarlo.

### 2026-10-21

**Decisiones**
- Verificador del paso 8 (opciones de la persona en modo plan, sesión del 2026-10-20 al 21):
  - "Inventado" (el ID no está en el snapshot) y "mal clasificado" (existe, pero no toca en esa sección) van
    separados, para distinguir alucinar de clasificar mal. Descartado contarlo todo como inventado.
  - Se comprueban los IDs y además las señales de cada línea (siguiente paso, "PR envejecida", "PR bloqueada" o
    "PR aprobada", "tarea estancada", "tarea bloqueada" con su motivo). Descartado comprobar solo IDs.
  - Dos medidas: por sección (decide el código de salida) y global (IDs en cualquier parte), para comparar con el
    prompt plano, que no usa los encabezados. Descartado medir solo por sección.
  - Alcance de la sesión: verificador y protocolo del eval; las ejecuciones las hace la persona.
- Decisiones del agente, aprobadas en el plan: cada clave de `expected` tiene una regla en `brief-check.ts`, como
  `OBSERVERS` en `snapshot-check.ts`, y una clave sin regla es un fallo. El ID de una línea es su primer
  `PR #n`/`WI #n`, con o sin enlace. En la demo se saltan los casos sin ID, como en `collect`.
- DRY (aprobado en el plan): `allPullRequests` sale de `snapshot-check.ts` y `caseIdsFromDemo` y `SNAPSHOT_PATH`
  pasan a `scripts/lib/demo.ts`; los usan `collect` y `verify-brief`.
- La variante (b) del eval va en una carpeta vacía con solo el snapshot. En el repo, "resume mi día" carga la skill
  (está en su descripción) y además se leen `CLAUDE.md` y el glosario. Decisión del agente en `docs/eval.md`; la
  persona puede revisarla.
- Eval (decisiones del agente, aprobadas en el plan de la sesión): el número global del verificador se deja como
  sale y el recuento a mano va en una columna aparte ("Global a mano"). El eval usa el snapshot de fixtures (A–Q),
  como proponía `docs/eval.md`. Las 6 ejecuciones valen tal cual, aunque los prompts variaron; se anota en Límites.
- Pasos opcionales (decisión de la persona): se hace el 8b en una sesión nueva. El 8c no se hace por ahora. Los dos
  son independientes. El agente recomendó el 8b porque es más pequeño, no toca `src/` y refuerza el eval; el 8c
  añade un puerto nuevo y un riesgo nuevo (el texto de "Contexto" pasa por la IA).

**Hechos comprobados**
- `npm run verify:brief` sobre el informe de la demo del 2026-10-20 (`output/brief-2026-10-20.md`, escrito por la
  skill): 28 comprobaciones de caso A–L en OK; 0 omisiones, mal clasificados e inventados; global 11/11.
- De punta a punta sobre fixtures: `npm run collect -- --fixtures`, skill `daily-brief` y
  `npm run verify:brief -- --fixtures` → todo coincide en A–Q, incluidos P y Q con "tarea bloqueada" y su motivo
  en Mis tareas y en Riesgos; global 16/16. Control con una copia sin la línea de P: 5 fallos (4 de caso y la
  omisión de WI #116 en Mis tareas). Después se restauró `output/` desde una copia (snapshot de la demo).
- 14 tests en `scripts/lib/tests/brief-check.test.ts`. Mutaciones de control: no mirar el texto de la línea hace
  fallar los 3 tests de señales; contar todo lo que sobra como inventado hace fallar el de mal clasificado.
  Restaurado desde una copia: 14/14. `npm run verify`: 167 tests en verde.
- Correcciones de la revisión de `revisor-tfm` (`docs/revisiones/2026-10-20.md`), por incumplir la skill
  `daily-brief` y la skill `testing`: `renderBrief` marcaba "tarea estancada" también en tareas con PR; el test de
  la medida global comprobaba dos comportamientos y pasa a ser dos.
- Documentación: `verify:brief` en `CLAUDE.md` (Comandos) y README (Uso, Verificación con el recorrido sin red,
  Estructura). La skill `daily-brief` nombra el verificador y pide no cambiar los textos de las señales.
- Eval (`docs/eval.md`):
  - Preparación y ejecución: snapshot de `npm run collect -- --fixtures` (11:31 UTC). La persona hizo 6 chats
    nuevos (3 en el repositorio, 3 en `~/Desktop/eval-prompt-plano/` con solo una copia del snapshot; `cmp` dice que
    es idéntica). Copió los informes y los datos de uso a mano. El agente los copió a `output/eval/a-1.md` … `b-3.md`.
  - `npm run verify:brief -- --fixtures output/eval/<x>.md`: a-1, a-2 y a-3 dan "Todo coincide" (16/16, 0
    inventados). b-1, b-2 y b-3 dan 60 comprobaciones fallidas y 0/16, 0/16 y 6/16 global.
  - Recuento del agente, leyendo los informes b enteros contra el snapshot: 16/16 IDs y ningún inventado en los tres.
    b-1 y b-2 ponen siguientes pasos donde el snapshot tiene `nextStep: null` (p. ej. "Empezar" en `WI #101`).
  - Los Hechos de a-1, a-2 y a-3 son idénticos (`diff`: solo cambian las Sugerencias 6–10).
  - Coste por informe: 0,47–0,66 $ con la skill y 0,25–0,32 $ con el prompt plano (informe de uso de Claude Code).

**Errores y correcciones**
- Cambios fuera del plan aprobado, avisados después y no antes (incumple "Desviación del plan aprobado"):
  - `reportFailures` recibe la unidad (`"comprobación(es)"`), porque decía "caso(s)" y aquí se cuentan
    comprobaciones.
  - `verify-brief` se niega si el snapshot y `--fixtures` no coinciden, porque si no todos los IDs fallarían sin
    decir por qué.
  - `main` es síncrona y se pasa a `runScript` con `Promise.resolve().then(main)` (lo pide `require-await`).
  - La frase de la skill pasó de "sin cambiar los encabezados" a incluir también "ni los textos de las señales".
  Son pequeños, pero la regla pide preguntar antes. Cambia: ante un detalle que no está en el plan, preguntar en el
  momento, aunque parezca menor.
- El cierre de la app interrumpió la sesión a mitad del paso, y la persona commiteó el verificador en `ad5063e`
  antes de que estuviera terminado. Al retomar, `git status` y `git log` lo mostraron; no se perdió nada.
- Eval: el agente puso 19 en "Casos que fallan" de (b). Contó sobre la salida del verificador cortada con
  `tail -40`, que no mostraba los fallos de A–H. Lo detectó `revisor-tfm` (`docs/revisiones/2026-10-21.md`); con
  `grep -c` sobre la salida entera da 39. Además, la conclusión decía "los mismos hechos" y no cuadraba con los
  siguientes pasos inventados de b-1 y b-2, y la frase sobre `PR #5` en b-3 era falsa. Corregido en `docs/eval.md`.
  Cambia: los números de una tabla se cuentan sobre la salida entera, nunca sobre un `tail`.

### 2026-10-22

**Decisiones**
- Material del máster (`~/Desktop/master-ia-material`, sesiones 1–5) revisado frente a los pasos pendientes. Ya
  estaba aprovechado: bitácora, `reflect`, tests semánticos, `harness-audit` y el resumen de `docs/contexto-track.md`.
  Útil para lo que falta: workflow del buscador (sesión 4) para la CI, plantilla de ADR (sesión 2), ficha y registro
  de evaluación (sesión 3) para los pasos 9 y 11, y fichas de delegación (sesiones 4 y 5) para el documento.
- La persona eligió seguir con el paso 10 (CI y ADR) antes del 8b.
- CI: patrones de la sesión 4 (permisos `contents: read`, `persist-credentials: false`, acciones fijadas por SHA,
  `concurrency`, `timeout-minutes`). `verify:brief` no va en la CI: necesita un informe de la IA y `output/` no se
  versiona.
- Node mínimo 20.19 en vez de 20.12 (decisión de la persona entre subir el mínimo o usar Node 22 solo en la CI):
  ESLint 10 y `@eslint/js` declaran `^20.19.0 || ^22.13.0 || >=24`, así que con 20.12 `npm run lint` no está
  garantizado.

**Hechos comprobados**
- SHAs de las acciones con `git ls-remote`: `actions/checkout` v6.1.0 = `d23441a…`, `actions/setup-node`
  v7.1.0 = `949feb2…`.
- En local (Node 22.22): `npm run verify` con 167 tests en verde y `npm run collect -- --fixtures` correcto.
- CI en GitHub con Node 20.19: `CI #1` del commit `305c777` en verde, 37 s (captura `docs/evidencias/ci.png`).
- README final: cada afirmación contrastada con el código. Las variables de `.env` salen de `src/config.ts` y
  `scripts/seed-demo.ts`; el seed escribe `fixtures/demo-ids.json` (`scripts/lib/seed.ts`); el puerto es
  `src/ports/devops-source.ts`; la vinculación no usa ramas (glosario). No se nombran los ámbitos del token: no
  están documentados en el repositorio.
