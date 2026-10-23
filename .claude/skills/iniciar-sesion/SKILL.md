---
name: iniciar-sesion
description: Prepara una sesión nueva: lee el estado del proyecto, comprueba el entorno y propone por dónde seguir. Úsala al empezar cada sesión o después de un traspaso.
---

# Iniciar sesión

No implementes nada hasta que la persona confirme.

1. Lee de `docs/bitacora.md` solo lo vigente, no el historial entero:
   - Busca con `grep -n '^## Registro\|^### ' docs/bitacora.md` dónde empieza el Registro y su última entrada.
   - Lee desde el principio hasta `## Registro`: formato, Estado, Próximo paso y Problemas abiertos.
   - Del Registro, lee solo la última entrada (la última `### AAAA-MM-DD`).
   - Las entradas anteriores, solo si el Próximo paso o la persona remiten a una; búscalas con `grep`.

   De `docs/plan.md`, lee solo la sección del paso actual.
2. Ejecuta `git status` y `git log --oneline -3`.
3. Ejecuta `npm run verify`.
4. Responde en 10 líneas como máximo:
   - Paso actual, qué está hecho y qué falta.
   - Próximo paso concreto según la bitácora.
   - Cambios sin commit, si los hay.
   - Estado de los checks. Si alguno falla, propón arreglarlo como primera tarea.
5. Pregunta si continuar con ese próximo paso.