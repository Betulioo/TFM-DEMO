---
name: daily-brief
description: Redacta el informe diario del desarrollador (Hechos con ID y Sugerencias) leyendo solo output/snapshot.json, y lo guarda en output/brief-AAAA-MM-DD.md. Úsala cuando se pida "el informe diario", "el brief", "resume mi día" o qué revisar y qué hacer hoy en Azure DevOps.
---

# Informe diario

Esta skill solo interpreta el snapshot: nunca llama a la API de Azure DevOps ni escribe en ella. Se usa solo sobre
el proyecto demo o sobre fixtures (práctica de datos de cliente de [`CLAUDE.md`](../../../CLAUDE.md)).

## Pasos

1. **Comprueba el snapshot.** Si no existe `output/snapshot.json`, o su `generatedAt` no es de hoy, para y pide a la
   persona que ejecute `npm run collect` (sobre la demo lo lanza ella). Para probar con datos falsos vale
   `npm run collect -- --fixtures`. No ejecutes ningún otro script.
2. **Lee solo `output/snapshot.json`.** No leas `fixtures/`, `expected.json`, `demo-ids.json` ni el código: el
   informe sale únicamente del snapshot.
3. **Escribe `output/brief-AAAA-MM-DD.md`** con la plantilla de abajo, sin cambiar los encabezados: el verificador
   del paso 8 busca los IDs por sección. La fecha es la de `generatedAt` tal cual, en UTC, también para "es de
   hoy" del paso 1 (decisión de la persona): una recogida entre las 00:00 y las 02:00 en España sale con la fecha
   del día anterior.
4. Al terminar, di la ruta del archivo y cuántos elementos hay en cada sección de Hechos.

## Reglas

- **Términos del glosario tal cual** ([`docs/glosario.md`](../../../docs/glosario.md)): "PR envejecida", "PR
  bloqueada", "tarea estancada", "tarea bloqueada", los nombres del siguiente paso…
- **No recalcules nada.** Copia las señales que ya trae el snapshot: `aged`, `blocked`, `approved` en las PRs y
  `nextStep`, `stale`, `blocked` en las tareas. No compares fechas con los umbrales, ni deduzcas votos, ni decidas
  por la etiqueta o el estado si una tarea está bloqueada.
- **Hechos siempre con ID** al principio de la línea, enlazado con el `webUrl` del snapshot: `[PR #12](<webUrl>)`,
  `[WI #345](<webUrl>)`. La PR de una tarea usa `pullRequest.webUrl`. Los IDs de las Sugerencias también van
  enlazados. Si falta `webUrl`, escribe el ID sin enlace; nunca construyas la URL.
- **"sin datos"**: si un campo es `null` o no aparece (p. ej. `iteration`, `startDate`, `assignedTo`), escribe
  "sin datos". No lo supongas. Excepción: `pullRequest: null` en una tarea significa "sin PR", y `nextStep: null`
  en una tarea sin PR es lo que pide el glosario (se muestra su estado).
- **Lista vacía**: escribe "Ninguna." en la sección. No la quites.
- Cada PR o tarea sale una vez por sección; puede repetirse entre secciones (p. ej. en su lista y en Riesgos).
- Las **Sugerencias** no aportan hechos nuevos: cada una cita el ID del hecho en que se basa.

## Qué va en cada sección

| Sección | Origen en el snapshot | Qué muestra cada línea |
|---|---|---|
| PRs pendientes de mi revisión | `pullRequestsPendingMyReview` | ID, título, autor y "PR envejecida" si `aged` |
| PRs pendientes del equipo | `pullRequestsPendingTeamReview` | ID, título, autor y "PR envejecida" si `aged` |
| Mis PRs | `myPullRequests` | ID, título y la señal: "PR bloqueada" (`blocked`), "PR aprobada" (`approved`) o "sin votos" |
| Mis tareas | `myTasks` | ID, título, estado; con PR: `PR #n` y su siguiente paso; sin PR: "sin PR" y "tarea estancada" si `stale`; con o sin PR, "tarea bloqueada (motivo: <lockReason o "sin datos">)" si `blocked` |
| Riesgos | las tres anteriores | Señales de riesgo del glosario: PR envejecida pendiente de mi revisión (`aged` en `pullRequestsPendingMyReview`), PR propia bloqueada (`blocked` en `myPullRequests`), tarea bloqueada (`blocked` en `myTasks`) y tarea estancada (`stale` en `myTasks`) |

**Orden de las Sugerencias** (de `docs/plan.md`, paso 7):
1. Revisar cada PR envejecida pendiente de mi revisión.
2. Atender cada PR propia bloqueada.
3. Desbloquear cada tarea bloqueada, citando su motivo.
4. Mover o actualizar cada tarea estancada.
5. El resto: otras PRs pendientes de mi revisión o del equipo y los siguientes pasos de mis tareas.

## Plantilla

Los `<…>` son marcadores: se sustituyen por los datos del snapshot. Ningún ID del informe sale de la plantilla.

```markdown
# Informe diario — AAAA-MM-DD

Usuario: <user.displayName> · Iteración: <iteration.name o "sin datos"> · Recogida: <generatedAt>
Umbrales: PR envejecida <agedPrDays> días · tarea estancada <staleTaskDays> días
Tarea bloqueada: etiqueta <blockedTaskCriteria.tag> o estado <blockedTaskCriteria.state>

## Hechos

### PRs pendientes de mi revisión
- [PR #<id>](<webUrl>) — <título> (autor: <nombre>) — PR envejecida

### PRs pendientes del equipo
- Ninguna.

### Mis PRs
- [PR #<id>](<webUrl>) — <título> — PR bloqueada

### Mis tareas
- [WI #<id>](<webUrl>) — <título> (<state>) — [PR #<id>](<pullRequest.webUrl>) — Siguiente paso: <nextStep>
- [WI #<id>](<webUrl>) — <título> (<state>) — sin PR — tarea estancada
- [WI #<id>](<webUrl>) — <título> (<state>) — sin PR — tarea bloqueada (motivo: <lockReason o "sin datos">)

### Riesgos
- [PR #<id>](<webUrl>) — PR envejecida pendiente de mi revisión
- [PR #<id>](<webUrl>) — PR propia bloqueada
- [WI #<id>](<webUrl>) — tarea bloqueada (motivo: <lockReason o "sin datos">)
- [WI #<id>](<webUrl>) — tarea estancada

## Sugerencias

1. Revisar [PR #<id>](<webUrl>): es una PR envejecida pendiente de mi revisión.
2. Atender los cambios solicitados en [PR #<id>](<webUrl>) (PR propia bloqueada).
3. Desbloquear [WI #<id>](<webUrl>): es una tarea bloqueada (motivo: <lockReason o "sin datos">).
4. Actualizar [WI #<id>](<webUrl>): es una tarea estancada.
```
