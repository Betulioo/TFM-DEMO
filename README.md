# azdo-daily-brief

Informe diario asistido por IA para desarrolladores que trabajan con **Azure DevOps** (Repos + Boards).
Responde a tres preguntas al empezar el día:

1. ¿Qué PRs esperan mi revisión o la de mi equipo, y cuáles están bloqueadas o envejecidas?
2. ¿En qué tareas de la iteración actual estoy y qué les falta?
3. ¿Qué riesgos tiene la iteración (tareas estancadas o bloqueadas, PRs envejecidas y PRs propias bloqueadas)?

> Estado: en desarrollo (TFM). Las secciones marcadas como *pendiente* se completan en pasos posteriores.

## Cómo funciona

| Fase | Quién | Qué hace |
|---|---|---|
| Recogida | Script TypeScript (sin IA) | Consulta la API de Azure DevOps y genera `output/snapshot.json` |
| Síntesis | Skill de Claude Code | Redacta el informe a partir del snapshot, citando IDs |
| Verificación | Script TypeScript | Compara el informe con los casos esperados del proyecto demo |
| Decisión | Persona | Revisa el informe y decide qué hacer |

## Requisitos

- Node.js ≥ 20.19
- Claude Code
- Una organización de Azure DevOps y un Personal Access Token de solo lectura

## Instalación

```bash
npm install
cp .env.example .env   # y rellena los valores
npm run typecheck
```

## Uso

La recogida (`npm run collect`) escribe `output/snapshot.json` con solo lectura contra Azure DevOps. Después, en
Claude Code, la skill `daily-brief` ("hazme el informe diario") lee solo ese snapshot y escribe
`output/brief-AAAA-MM-DD.md` con Hechos (siempre con ID, enlazado a Azure DevOps) y Sugerencias.

```bash
npm run check:conn              # comprueba la conexión con Azure DevOps (.env)
npm run list:prs                # PRs de la demo comparadas con fixtures/demo-ids.json
npm run list:tasks              # work items de la iteración actual y "Mis tareas"
npm run collect                 # output/snapshot.json, comparado con expected.json en la demo
npm run list:prs -- --fixtures  # lo mismo con el adaptador falso, sin red
npm run verify:brief            # comprueba output/brief-AAAA-MM-DD.md contra expected.json
npm run verify                  # typecheck, lint y tests
```

## Verificación

`npm run verify:brief` compara el informe con `fixtures/expected.json`. Solo lee archivos locales. Para cada caso
comprueba en qué sección de la plantilla está su ID y qué dice su línea (siguiente paso, "PR envejecida", "tarea
bloqueada" con su motivo…). Por sección cuenta aciertos, omisiones, mal clasificados (el ID existe pero no toca en
esa sección) e inventados (el ID no está en el snapshot). Comprueba también que las Sugerencias solo citan hechos.
Además da una medida global, sin mirar encabezados, para comparar con un prompt sin la plantilla
([`docs/eval.md`](docs/eval.md)). Si algo falla por sección, termina con código 1.

Recorrido sin red, con el adaptador falso:

```bash
npm run collect -- --fixtures        # output/snapshot.json con los casos A–Q
# en Claude Code: "hazme el informe diario" (skill daily-brief)
npm run verify:brief -- --fixtures   # o -- --fixtures <ruta> para otro informe
```

Sobre la demo, después de `npm run collect` y de la skill: `npm run verify:brief` (IDs de `fixtures/demo-ids.json`).

La CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) se ejecuta en cada push a `main` y en cada PR:
`npm ci`, `npm run verify` y `npm run collect -- --fixtures`, sin secretos ni red. `verify:brief` no va en la CI
porque necesita un informe escrito por la IA. Por qué la IA no llama a la API:
[ADR 001](docs/adr/001-recogida-determinista.md).

## Estructura

```
src/               Recogida de datos de Azure DevOps (domain, ports, application, adapters); tests junto al código en tests/
scripts/           Recogida (collect), verificador del informe (verify-brief), scripts de consulta y seed del proyecto demo; tests en lib/tests/
test/              Checks transversales (arquitectura, que npm test vea todos los tests) y helpers compartidos
fixtures/          Casos esperados del proyecto demo
.claude/           Skills y agente de trabajo; daily-brief es la skill del informe
docs/              Plan, bitácora, glosario, eval y enunciado del TFM
docs/adr/          Decisiones de arquitectura (ADR)
docs/evidencias/   Capturas para el documento del TFM
.github/workflows/ CI: typecheck, lint, tests y recogida con fixtures
output/            Salidas generadas (no se versiona)
```
