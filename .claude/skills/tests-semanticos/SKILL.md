---
name: tests-semanticos
description: Criterios para que cada test compruebe un comportamiento con significado (una definición del glosario o un caso de fixtures/expected.json) y no detalles internos. Úsala al escribir o revisar tests; la skill testing cubre el cómo (herramientas y dobles), esta el qué.
---

# Tests semánticos

Un test vale lo que vale la regla que protege. Antes de escribir o aprobar uno, responde: **¿qué
comportamiento del glosario o qué caso de `expected.json` dejaría de cumplirse si este test fallara?**
Si no hay respuesta, el test sobra o está mal enfocado.

Fuentes (no repitas su contenido, enlázalo):
- Definiciones y umbrales: [`docs/glosario.md`](../../../docs/glosario.md).
- Casos A–N y su resultado esperado: [`fixtures/expected.json`](../../../fixtures/expected.json).
- Reglas del proyecto y de arquitectura: [`CLAUDE.md`](../../../CLAUDE.md).
- Herramientas, dobles y estructura: skill [`testing`](../testing/SKILL.md).

## Criterios

1. **Cada test nombra lo que protege.** El nombre cita el término del glosario o la clave del caso:
   `"mis tareas: H (cerrada) no aparece"`, `"siguiente paso de E: Atender cambios solicitados"`.
   Un nombre como `"filtra correctamente"` o `"funciona con datos"` no dice qué regla se rompe.

2. **Aserciones sobre resultados observables.** Se comprueba lo que devuelve el puerto o la regla (qué IDs
   salen, qué siguiente paso, qué está envejecido), no cómo se calcula: ni el orden de llamadas internas, ni
   variables privadas, ni cuántas veces se llamó a una función auxiliar. Excepción: en el adaptador real,
   la petición a la API (ruta y parámetros) **es** el resultado observable.

3. **Tiempo y umbrales inyectados.** `now`, `AGED_PR_DAYS`, `STALE_TASK_DAYS`… se pasan como parámetros con
   valores fijos en el test. Nunca la hora real: un test que pasa hoy y falla mañana no protege nada. Para un
   umbral, prueba el límite exacto y sus vecinos (un día antes, el día justo, un día después).

4. **Los negativos pesan igual que los positivos.** Lo que **no** debe aparecer es parte del comportamiento:
   H (cerrada), I (otro sprint) y J (sin asignar) fuera de mis tareas; L (ya votada) fuera de pendientes de mi
   revisión. Compara la lista completa (`deepEqual` de IDs o claves), no `includes` de los que sí están: así
   un elemento que sobra también hace fallar el test.

5. **Sin red.** Los tests usan el adaptador falso (y, para probar el adaptador real, un lector falso). Nunca la
   API, `.env` ni tokens.

## Al revisar un test existente

Para cada test, anota:
- **Qué protege:** término del glosario o caso de `expected.json` (o "nada identificable").
- **Qué falla** de los criterios 1–5, con la línea.
- **Qué falta:** casos del glosario o de `expected.json` sin ningún test, sobre todo los negativos y los límites.

No corrijas al revisar: informa y deja que la persona decida.
