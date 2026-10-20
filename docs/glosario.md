# Glosario

Definiciones exactas de los términos del informe. El código, la skill y los casos de prueba
(`fixtures/expected.json`) usan estos términos tal cual. Si una definición cambia, cambia aquí primero.

Los umbrales marcados como *configurable* se pueden ajustar en `.env`.

## Ámbito

| Término | Definición |
|---|---|
| **Usuario** | La identidad del token de lectura (`AZDO_PAT`). |
| **Iteración actual** | La iteración del equipo por defecto del proyecto cuyo rango de fechas incluye hoy. |
| **Categoría de estado** | Clasificación que Azure DevOps da a cada estado de un work item: *Proposed*, *InProgress*, *Resolved*, *Completed* o *Removed*. Es común a todos los procesos (Basic, Agile, Scrum, personalizados). |
| **Mis equipos** | Equipos del proyecto de los que el usuario es miembro. |
| **Mis tareas** | Work items de cualquier tipo, en la iteración actual, asignados al usuario y cuya categoría de estado no es *Completed* ni *Removed*. |

## Pull requests

Votos de revisor en Azure DevOps: `10` aprobada, `5` aprobada con sugerencias, `0` sin voto,
`-5` esperando al autor, `-10` rechazada.

| Término | Definición |
|---|---|
| **PR activa** | PR con estado *active*. Las PR en borrador no cuentan para nada del informe, salvo para el siguiente paso de una tarea (regla 2). |
| **PR en borrador** | PR con estado *active* marcada como borrador (*draft*). |
| **PR pendiente de mi revisión** | PR activa en la que el usuario es revisor, no es el autor y su voto es `0`. |
| **PR pendiente del equipo** | PR activa en la que uno de mis equipos es revisor, el usuario no es el autor y no figura como revisor individual. Si figura con voto `0`, ya es "PR pendiente de mi revisión"; si votó, ya la revisó. |
| **PR bloqueada** | PR activa con al menos un voto `-5` o `-10`. |
| **PR aprobada** | PR activa con al menos un voto `5` o `10` y ningún voto negativo. |
| **PR envejecida** | PR activa creada hace **3 días naturales o más** (*configurable*: `AGED_PR_DAYS`). |
| **Mis PRs** | PRs activas cuyo autor es el usuario. |

## Vinculación entre tarea y PR

| Término | Definición |
|---|---|
| **PR de una tarea** | PR vinculada al work item en Azure DevOps (enlace de tipo *Pull Request*). Una PR vinculada que no se encuentra (borrada o sin acceso) se ignora, como si no estuviera vinculada. Si hay varias, cuenta la más reciente: la de mayor ID. |

Las ramas no se consultan: la herramienta no comprueba si una tarea tiene rama.

## Siguiente paso de una tarea

Cada tarea de "Mis tareas" **con PR** recibe **un único** siguiente paso, evaluando las reglas en este orden
(gana la primera que se cumple). Una tarea **sin PR** no tiene siguiente paso: el informe muestra su estado y,
si lo está, que es una tarea estancada.

| # | Siguiente paso | Condición |
|---|---|---|
| 1 | **Cerrar la tarea** | Su PR está completada (*merged*). |
| 2 | **PR en borrador** | Su PR es una PR en borrador. |
| 3 | **Completar la PR** | Su PR es una PR aprobada. |
| 4 | **Atender cambios solicitados** | Su PR es una PR bloqueada. |
| 5 | **Esperar revisión** | Su PR es una PR activa sin votos. |
| 6 | **Revisar estado** | Tiene PR y no se cumple ninguna de las anteriores (por ejemplo, PR abandonada). |

## Señales de riesgo

| Término | Definición |
|---|---|
| **Tarea estancada** | Tarea en categoría *InProgress* cuya última modificación tiene **3 días naturales o más** (*configurable*: `STALE_TASK_DAYS`). |
| **PR envejecida pendiente de mi revisión** | Cumple las dos definiciones. Es la señal de mayor prioridad del informe. |
| **PR propia bloqueada** | PR de "Mis PRs" que es una PR bloqueada. |
| **Tarea bloqueada** | Tarea de "Mis tareas" con la etiqueta `Blocked` en `System.Tags` (*configurable*: `BLOCKED_TAG`) o en el estado `Locked` (*configurable*: `BLOCKED_STATE`). La etiqueta cuenta entera y sin distinguir mayúsculas (`Not Blocked` no cuenta); el estado, por su nombre exacto. |
| **Motivo del bloqueo** | Texto del campo de work item cuyo nombre de referencia es `LOCK_REASON_FIELD` (p. ej. `Custom.LockReason`, del proceso del cliente). Si no está configurado o viene vacío: "sin datos". |
