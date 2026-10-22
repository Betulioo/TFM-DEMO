# azdo-daily-brief

Informe diario asistido por IA para desarrolladores que trabajan con **Azure DevOps** (Repos + Boards).
Responde a tres preguntas al empezar el día:

1. ¿Qué PRs esperan mi revisión o la de mi equipo, y cuáles están bloqueadas o envejecidas?
2. ¿En qué tareas de la iteración actual estoy y qué les falta?
3. ¿Qué riesgos tiene la iteración (tareas estancadas o bloqueadas, PRs envejecidas y PRs propias bloqueadas)?

Es el caso práctico de un TFM ([enunciado](docs/enunciado-tfm.md)). La versión entregada se identifica con el tag
`v1.0`. Todo se ha probado sobre un proyecto demo de Azure DevOps y sobre fixtures; ningún dato de cliente pasa por la IA.

## Cómo funciona

| Fase | Quién | Qué hace |
|---|---|---|
| Recogida | Script TypeScript (sin IA) | Consulta la API de Azure DevOps (solo lectura) y genera `output/snapshot.json` |
| Síntesis | Skill de Claude Code | Redacta el informe a partir del snapshot, citando IDs |
| Verificación | Script TypeScript | Compara el informe con los casos esperados (`fixtures/expected.json`) |
| Decisión | Persona | Revisa el informe y decide qué hacer |

La IA no llama a la API: solo lee el snapshot. Así su resultado se puede comprobar contra datos que no dependen de
ella ([ADR 001](docs/adr/001-recogida-determinista.md)). Los términos ("PR envejecida", "tarea bloqueada"…) y sus
reglas están en el [glosario](docs/glosario.md).

## Requisitos

- Node.js ≥ 20.19
- Claude Code (para la síntesis)
- Para usarlo contra Azure DevOps: una organización y un Personal Access Token de solo lectura. Para probarlo con
  fixtures no hace falta nada de esto.

## Instalación

```bash
npm install            # instala dependencias y activa el hook pre-push (npm run verify)
npm run verify         # typecheck, lint y tests, sin red
```

Para Azure DevOps, copia `.env.example` a `.env` y rellena los valores. `.env` no se sube nunca.

| Variable | Para qué | Por defecto |
|---|---|---|
| `AZDO_ORG_URL` | URL de la organización (`https://dev.azure.com/<org>`) | obligatoria |
| `AZDO_PROJECT` | Proyecto | obligatoria |
| `AZDO_PAT` | Token de solo lectura. Lee PRs, work items, iteraciones y equipos del proyecto | obligatoria |
| `AGED_PR_DAYS` / `STALE_TASK_DAYS` | Días para "PR envejecida" y "tarea estancada" | 3 / 3 |
| `BLOCKED_TAG` / `BLOCKED_STATE` | Etiqueta o estado que marcan una tarea bloqueada | `Blocked` / `Locked` |
| `LOCK_REASON_FIELD` | Campo con el motivo del bloqueo (p. ej. `Custom.LockReason`) | sin valor: motivo "sin datos" |
| `AZDO_PAT_SEED`, `AZDO_PAT_TEAMMATE`, `AZDO_USER_EMAIL` | Solo para sembrar el proyecto demo | — |

```bash
npm run check:conn     # comprueba la conexión (solo lectura)
```

### Proyecto demo (opcional)

`npm run seed:demo` crea en un proyecto **vacío** los casos de `fixtures/expected.json` (work items, ramas y PRs)
con tokens propios de la demo (`AZDO_PAT_SEED` y el de un compañero, `AZDO_PAT_TEAMMATE`). Pide confirmar
organización y proyecto, y se niega si el proyecto ya tiene work items. No lo apuntes nunca a una organización real.
Guarda los IDs creados en `fixtures/demo-ids.json`, que usan `collect` y `verify:brief` para comparar.

## Uso

```bash
npm run collect                 # output/snapshot.json (en la demo, comparado con expected.json)
# en Claude Code, en este repositorio: "hazme el informe diario" (skill daily-brief)
#   → output/brief-AAAA-MM-DD.md con Hechos (siempre con ID, enlazados a Azure DevOps) y Sugerencias
npm run verify:brief            # comprueba el informe contra expected.json
```

Sin Azure DevOps, con el adaptador falso (casos A–Q):

```bash
npm run collect -- --fixtures
# en Claude Code: "hazme el informe diario"
npm run verify:brief -- --fixtures   # o -- --fixtures <ruta> para otro informe
```

Consultas sueltas: `npm run list:prs` y `npm run list:tasks` (con `-- --fixtures`, sin red).

## Verificación

| Comprobación | Qué cubre | Dónde corre |
|---|---|---|
| `npm run verify` | Tipos, lint (capas hexagonales, solo GET, nombres) y 167 tests sin red: reglas del glosario, casos de `expected.json`, salvaguardas del seed, arquitectura | Local, pre-push y CI |
| `npm run collect -- --fixtures` | La recogida de punta a punta con el adaptador falso | Local y CI |
| `npm run verify:brief` | El informe de la IA: por caso y por sección (aciertos, omisiones, mal clasificados, inventados), Sugerencias sin hechos nuevos y una medida global | Local (necesita un informe de la IA) |
| Eval ([`docs/eval.md`](docs/eval.md)) | Skill frente a prompt plano, 3 ejecuciones de cada uno | Hecho una vez, con evidencias en `docs/evidencias/` |

La CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) se ejecuta en cada push a `main` y en cada PR, sin
secretos ni red. `verify:brief` no va en ella porque necesita un informe escrito por la IA y `output/` no se versiona.

## Dónde está la aportación

| Parte | Archivos |
|---|---|
| Recogida (hexagonal) | `src/domain` (reglas), `src/ports`, `src/application`, `src/adapters/azdo` (cliente solo GET), `src/adapters/fixtures` |
| Síntesis | `.claude/skills/daily-brief/SKILL.md` |
| Verificación | `scripts/verify-brief.ts`, `scripts/lib/brief-check.ts`, `fixtures/expected.json` |
| Arnés de desarrollo | `CLAUDE.md`, skills de `.claude/skills/` (`iniciar-sesion`, `testing`, `tests-semanticos`, `reflect`, `revisar-tfm`), agente `revisor-tfm`, `eslint.config.js`, `test/architecture.test.ts`, `.githooks/pre-push`, CI |
| Documentación | `docs/plan.md`, `docs/bitacora.md` (decisiones y evidencias), `docs/glosario.md`, `docs/eval.md`, `docs/adr/` |

## Reutilización en otros proyectos

- **Se reutiliza tal cual** en cualquier proyecto de Azure DevOps: la recogida, la skill, el verificador, la CI y
  el arnés. No depende del proceso: filtra por asignación e iteración y usa las categorías de estado (*Proposed*,
  *InProgress*, *Resolved*, *Completed*), comunes a Basic, Agile, Scrum y procesos personalizados.
- **Se configura** en `.env`: umbrales, etiqueta o estado de bloqueo y campo del motivo.
- **Hay que adaptar**:
  - Una señal nueva (p. ej. "PR sin revisores") se define en el glosario, se añade su caso a
    `fixtures/expected.json`, su regla a `src/domain` y su línea a la plantilla de la skill.
  - Otra herramienta (GitHub, Jira): un adaptador nuevo que implemente el puerto
    (`src/ports/devops-source.ts`). El puerto usa conceptos de Azure DevOps (iteración, equipo revisor): la otra
    herramienta necesita un equivalente o hay que cambiar el puerto. No se ha probado.
  - Otro asistente de IA: la skill es un `SKILL.md` en Markdown; habría que llevarlo al formato de esa herramienta.

## Límites

- Probado sobre el proyecto demo y fixtures, no sobre datos de cliente (las cuentas de IA son personales).
- Sin comprobar con datos reales: PRs con un equipo como revisor, paginación con muchos equipos o repositorios, y
  si `Locked` es "en curso" en el proceso del cliente. Detalle en [`docs/bitacora.md`](docs/bitacora.md)
  (Problemas abiertos).
- El informe se genera desde Claude Code de forma interactiva. Pendiente: la medición de tiempos y el cálculo de
  negocio (pasos 9 y 11 de [`docs/plan.md`](docs/plan.md)).

## Estructura

```
src/                Recogida de datos de Azure DevOps (domain, ports, application, adapters); tests junto al código en tests/
scripts/            Recogida (collect), verificador del informe (verify-brief), scripts de consulta y seed del proyecto demo; tests en lib/tests/
test/               Checks transversales (arquitectura, que npm test vea todos los tests) y helpers compartidos
fixtures/           Casos esperados (expected.json) e IDs del proyecto demo (demo-ids.json)
.claude/            Skills y agente de trabajo; daily-brief es la skill del informe
.github/workflows/  CI: typecheck, lint, tests y recogida con fixtures
docs/               Plan, bitácora, glosario, eval y enunciado del TFM
docs/adr/           Decisiones de arquitectura (ADR)
docs/evidencias/    Capturas para el documento del TFM
output/             Salidas generadas (no se versiona)
```
