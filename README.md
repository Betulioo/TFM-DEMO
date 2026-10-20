# azdo-daily-brief

Informe diario asistido por IA para desarrolladores que trabajan con **Azure DevOps** (Repos + Boards).
Responde a tres preguntas al empezar el día:

1. ¿Qué PRs esperan mi revisión o la de mi equipo, y cuáles están bloqueadas o envejecidas?
2. ¿En qué tareas de la iteración actual estoy y qué les falta?
3. ¿Qué riesgos tiene la iteración (tareas estancadas y PRs envejecidas)?

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

*Pendiente (pasos 4–7).*

## Verificación

*Pendiente (paso 8).*

## Estructura

```
src/               Recogida de datos de Azure DevOps
scripts/           Seed del proyecto demo y verificación
fixtures/          Casos esperados del proyecto demo
.claude/skills/    Skill que genera el informe
docs/evidencias/   Capturas para el documento del TFM
output/            Salidas generadas (no se versiona)
```
