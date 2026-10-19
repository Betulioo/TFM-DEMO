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
| **Mis tareas** | Work items de cualquier tipo, en la iteración actual, asignados al usuario y cuya categoría de estado no es *Completed* ni *Removed*. |

## Pull requests

Votos de revisor en Azure DevOps: `10` aprobada, `5` aprobada con sugerencias, `0` sin voto,
`-5` esperando al autor, `-10` rechazada.

| Término | Definición |
|---|---|
| **PR activa** | PR con estado *active*. Las PR en borrador (*draft*) no cuentan para nada del informe. |
| **PR pendiente de mi revisión** | PR activa en la que el usuario es revisor, no es el autor y su voto es `0`. |
| **PR bloqueada** | PR activa con al menos un voto `-5` o `-10`. |
| **PR aprobada** | PR activa con al menos un voto `5` o `10` y ningún voto negativo. |
| **PR envejecida** | PR activa creada hace **3 días naturales o más** (*configurable*: `AGED_PR_DAYS`). |
| **Mis PRs** | PRs activas cuyo autor es el usuario. |

## Vinculación entre tarea, rama y PR

| Término | Definición |
|---|---|
| **PR de una tarea** | PR vinculada al work item en Azure DevOps (enlace de tipo *Pull Request*). Si hay varias, cuenta la más reciente. |
| **Rama de una tarea** | Rama cuyo nombre lleva el ID del work item justo después del prefijo: `feat/12345_nombre_tarea` es la rama del WI #12345. Patrón por defecto `^[^/]+/(\d+)(?:[_-]|$)` (*configurable*: `BRANCH_ID_PATTERN`; el primer grupo debe capturar el ID). `fix/2024_dependencias` sería la rama del WI #2024, así que el patrón debe ajustarse a la convención real de cada equipo. |

## Siguiente paso de una tarea

Cada tarea de "Mis tareas" recibe **un único** siguiente paso, evaluando las reglas en este orden
(gana la primera que se cumple):

| # | Siguiente paso | Condición |
|---|---|---|
| 1 | **Cerrar la tarea** | Su PR está completada (*merged*). |
| 2 | **Completar la PR** | Su PR es una PR aprobada. |
| 3 | **Atender cambios solicitados** | Su PR es una PR bloqueada. |
| 4 | **Esperar revisión** | Tiene PR activa sin votos. |
| 5 | **Abrir PR** | Tiene rama pero no PR. |
| 6 | **Crear rama** | Categoría *InProgress* sin rama ni PR. |
| 7 | **Empezar** | Categoría *Proposed*. |
| 8 | **Revisar estado** | Ninguna de las anteriores (por ejemplo, *Resolved* sin PR). |

## Señales de riesgo

| Término | Definición |
|---|---|
| **Tarea estancada** | Tarea en categoría *InProgress* cuya última modificación tiene **3 días naturales o más** (*configurable*: `STALE_TASK_DAYS`). |
| **PR envejecida pendiente de mi revisión** | Cumple las dos definiciones. Es la señal de mayor prioridad del informe. |
