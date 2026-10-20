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

- Node.js ≥ 20.12
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
npm run verify                  # typecheck, lint y tests
```

## Verificación

*Pendiente (paso 8).*

## Estructura

```
src/               Recogida de datos de Azure DevOps (domain, ports, application, adapters); tests junto al código en tests/
scripts/           Recogida (collect), scripts de consulta y seed del proyecto demo; tests en lib/tests/
test/              Checks transversales (arquitectura, que npm test vea todos los tests) y helpers compartidos
fixtures/          Casos esperados del proyecto demo
.claude/           Skills y agente de trabajo; daily-brief es la skill del informe
docs/              Plan, bitácora, glosario y enunciado del TFM
docs/evidencias/   Capturas para el documento del TFM
output/            Salidas generadas (no se versiona)
```
