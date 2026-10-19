---
name: revisar-tfm
description: Revisa en solo lectura si lo implementado cumple el plan del proyecto y los requisitos del TFM, y lista lo que falta con evidencias. Úsala al cerrar un paso del plan, antes de la entrega o cuando se pida "revisar el TFM" o "qué me falta". No corrige nada.
---

# Revisar el TFM

Revisión independiente del estado del proyecto frente a su plan y frente al enunciado del TFM.
Informas; la persona decide. **No modificas ningún archivo** salvo el informe de revisión.

## Fuentes (léelas todas antes de opinar)

- `docs/enunciado-tfm.md` — requisitos del TFM. Si no existe, detente y pídelo.
- `docs/plan.md` — diseño y criterio de "hecho" de cada paso.
- `docs/bitacora.md` — estado declarado y decisiones.
- `docs/glosario.md` y `fixtures/expected.json` — definiciones y casos esperados.
- `CLAUDE.md` — reglas del proyecto.
- El código (`src/`, `scripts/`, `.claude/skills/`) y `docs/evidencias/`.

## Comprobaciones

### A. Proyecto (lo implementado frente al plan)

1. Ejecuta `npm run typecheck` y, si existe, `npm test`. Anota el resultado tal cual.
2. Para cada paso marcado como hecho en la bitácora: ¿el código cumple el diseño y el criterio de "hecho" de `plan.md`?
3. Para cada término del glosario: ¿está implementado y tiene al menos un test? Indica dónde.
4. Reglas de `CLAUDE.md`:
   - `src/` no contiene peticiones distintas de GET a Azure DevOps.
   - Ningún token aparece en archivos versionados ni en la salida de los scripts.
   - `output/` no está versionado.
   - No hay datos de cliente en el repositorio.
5. ¿La bitácora refleja el estado real? (pasos marcados sin hacer, decisiones sin registrar)

### B. TFM (el repositorio frente al enunciado)

Para cada requisito del enunciado, asigna un estado: **Cubierto**, **Parcial** o **Falta**, siempre con la evidencia
(ruta del archivo o resultado de un comando). Como mínimo:

- Las 6 secciones del documento técnico y si hay material para cada una.
- Capturas en `docs/evidencias/` y qué secciones respaldan.
- Instrucciones para preparar el entorno y probar la solución.
- Versión identificada (tag o commit).
- Justificación de negocio: ¿hay datos **medidos** (tiempo manual, tiempo con la herramienta, tokens) o solo estimaciones?
- Distinción explícita entre implementado y probado, simulado y pendiente.
- Reutilización: qué se reutiliza y qué hay que adaptar.

## Reglas de la revisión

- Cada afirmación lleva su evidencia. Si algo no se puede comprobar, escribe "no verificable" y por qué.
- No des por bueno algo porque esté escrito en la bitácora o en un comentario: compruébalo en el código o con un comando.
- No propongas funcionalidades nuevas. Señala solo lo que falta para cumplir el plan o el enunciado.

## Salida

Escribe `docs/revisiones/AAAA-MM-DD.md` (crea la carpeta si no existe) y muestra el resumen en el chat:

1. **Resultado de typecheck y tests.**
2. **Tabla del proyecto:** paso · estado · evidencia · problema detectado.
3. **Tabla del TFM:** requisito · estado · evidencia · qué falta.
4. **Los 3 riesgos principales** para la entrega, ordenados por impacto.
5. **Siguientes acciones**, como máximo 5, concretas y ordenadas.