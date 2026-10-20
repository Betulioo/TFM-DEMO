---
name: revisar-tfm
description: Revisa en solo lectura si lo implementado cumple el plan del proyecto y los requisitos del TFM, y lista lo que falta con evidencias. Úsala al cerrar un paso del plan, antes de la entrega o cuando se pida "revisar el TFM" o "qué me falta". No corrige nada. Para no llenar el contexto, prefiere el agente revisor-tfm.
---

# Revisar el TFM

Revisión independiente del estado del proyecto frente a su plan y frente al enunciado del TFM.
Informas; la persona decide. **No modificas ningún archivo** salvo el informe de revisión.

## Fuentes (léelas todas antes de opinar)

Si falta alguna, sigue con lo demás y di al principio del resultado qué archivo falta.

- `docs/enunciado-tfm.md` — requisitos del TFM.
- `docs/plan.md` — diseño y criterio de "hecho" de cada paso.
- `docs/bitacora.md` — estado declarado y decisiones.
- `docs/glosario.md` y `fixtures/expected.json` — definiciones y casos esperados.
- `CLAUDE.md` — reglas del proyecto.
- El código (`src/`, `scripts/`, `.claude/skills/`) y `docs/evidencias/`.

## Comprobaciones

### A. Proyecto (lo implementado frente al plan)

1. Ejecuta `npm run typecheck`, `npm run lint` y `npm test`. Anota el resultado tal cual.
2. Ejecuta el check de arquitectura por separado (`npx tsx --test test/architecture.test.ts`) y anota cada
   regla de la sección "Arquitectura" de `CLAUDE.md` con su resultado. Si el archivo no existe, es un hallazgo.
3. Revisa los tests existentes (`test/*.test.ts`) con los criterios de `.claude/skills/tests-semanticos/SKILL.md`:
   léela antes y aplica su apartado "Al revisar un test existente". No copies sus criterios en el informe;
   cita el número del criterio que falla.
4. Para cada paso marcado como hecho en la bitácora: ¿el código cumple el diseño y el criterio de "hecho" de `plan.md`?
5. Para cada término del glosario: ¿está implementado y tiene al menos un test? Indica dónde.
6. Reglas de `CLAUDE.md` que no cubre el check de arquitectura:
   - Ningún token aparece en archivos versionados ni en la salida de los scripts.
   - `output/` no está versionado.
   - No hay datos de cliente en el repositorio.
7. ¿La bitácora refleja el estado real? (pasos marcados sin hacer, decisiones sin registrar)

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

1. **Resultado de typecheck, lint, tests y check de arquitectura.**
2. **Tabla de tests:** archivo · test · qué protege · criterio de `tests-semanticos` que falla · casos sin test.
3. **Tabla del proyecto:** paso · estado · evidencia · problema detectado.
4. **Tabla del TFM:** requisito · estado · evidencia · qué falta.
5. **Los 3 riesgos principales** para la entrega, ordenados por impacto.
6. **Siguientes acciones**, como máximo 5, concretas y ordenadas.