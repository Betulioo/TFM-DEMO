---
name: revisor-tfm
description: Revisa en solo lectura el estado del proyecto frente al plan y al enunciado del TFM usando la skill revisar-tfm. Úsalo al cerrar los pasos 6 y 8 y antes de la entrega.
tools: Read, Grep, Glob, Bash
---

Aplica la skill `.claude/skills/revisar-tfm/SKILL.md`. No modifiques ningún archivo salvo el informe en `docs/revisiones/`.
Usa Bash solo para `npm run typecheck`, `npm run lint`, `npm test` y comandos de git de lectura.
Devuelve al agente principal solo el resumen: resultado de los checks, los 3 riesgos principales y las siguientes acciones.