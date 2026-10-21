# Eval: skill `daily-brief` frente a prompt plano

Paso 8 de [`docs/plan.md`](plan.md). Pregunta: **¿la skill da un informe más correcto que pedírselo a la IA sin
más?** Se mide con el verificador (`npm run verify:brief`), con el mismo snapshot y chats nuevos e independientes.

Estado: **hecho** (2026-10-21). Ejecuciones de la persona; verificación, recuento a mano y análisis del agente.

## Qué se compara

| Variante | Dónde | Qué se pide |
|---|---|---|
| (a) Con la skill | Claude Code abierto en este repositorio | "hazme el informe diario" (carga la skill `daily-brief`) |
| (b) Prompt plano | Claude Code abierto en una carpeta vacía que solo tiene una copia de `snapshot.json` | "resume mi día a partir de snapshot.json" |

La variante (b) va en una carpeta aparte porque, en este repositorio, "resume mi día" carga la skill (está en su
descripción) y además se leen `CLAUDE.md` y el glosario. Así (b) mide la IA sin el contexto del proyecto.

3 ejecuciones de cada variante, cada una en un chat nuevo: 6 en total.

## Preparación (una vez)

1. `npm run collect -- --fixtures`. Se usa el snapshot del adaptador falso porque tiene los 17 casos (A–Q); el de la
   demo no tiene M, N, O, P ni Q.
2. No volver a ejecutar `collect` hasta terminar las 6: todas usan el mismo `output/snapshot.json`. Las 6 van el
   mismo día (UTC), porque la skill se niega con un snapshot que no es de hoy.
3. Carpeta para (b): una carpeta vacía fuera del repositorio con una copia de `output/snapshot.json`.
4. Carpeta para los informes: `output/eval/` (no se versiona, como todo `output/`).

## Cada ejecución

1. Abrir un chat nuevo en la carpeta de su variante y escribir el prompt de la tabla, sin nada más.
2. Guardar el informe en `output/eval/<variante>-<n>.md` (p. ej. `a-1.md`, `b-2.md`). En (a) la skill escribe
   `output/brief-AAAA-MM-DD.md`: se mueve a esa ruta. En (b), si la respuesta solo sale en el chat, se copia tal
   cual a un archivo.
3. Anotar el tiempo (desde enviar el prompt hasta tener el informe) y los tokens del chat, tal como los muestre la
   herramienta. Si no se pueden ver, "sin datos".
4. `npm run verify:brief -- --fixtures output/eval/<variante>-<n>.md` y pasar los números a la tabla.

## Qué se anota

- **Por sección** (solo tiene sentido en (a), que usa los encabezados de la plantilla): aciertos, omisiones, mal
  clasificados (el ID existe pero no toca en esa sección) e inventados (el ID no está en el snapshot), sumados en
  las 5 secciones de Hechos. También las comprobaciones de caso que fallan (señales como el siguiente paso o
  "tarea bloqueada") y los IDs de Sugerencias sin hecho.
- **Global** (las dos variantes): de los IDs esperados, cuántos aparecen en cualquier parte del texto, cuántos
  faltan y cuántos IDs no existen en el snapshot.

## Resultados

Snapshot de fixtures generado el 2026-10-21 a las 11:31 UTC (`npm run collect -- --fixtures`). Cada fila sale de
`npm run verify:brief -- --fixtures output/eval/<ejecución>.md`, salvo la columna "a mano" y las tres últimas.

| Ejecución | Variante | Global: aciertos / esperados | Global a mano | Global: inventados | Sección: omisiones | Sección: mal clasificados | Sección: inventados | Casos que fallan | Sugerencias sin hecho | Tiempo | Tokens (salida / cache read / cache write) | Coste |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a-1 | skill | 16/16 | 16/16 | 0 | 0 | 0 | 0 | 0 | 0 | 2 min | 769 / 888,5k / 42,2k | 0,66 $ |
| a-2 | skill | 16/16 | 16/16 | 0 | 0 | 0 | 0 | 0 | 0 | 1 min | 697 / 607,8k / 30,6k | 0,47 $ |
| a-3 | skill | 16/16 | 16/16 | 0 | 0 | 0 | 0 | 0 | 0 | 1 min | 695 / 535,9k / 36,8k | 0,51 $ |
| b-1 | prompt plano | 0/16 | 16/16 | 0 | 21 | 0 | 0 | 39 | 0 | < 1 min | 996 / 239,7k / 27,7k | 0,32 $ |
| b-2 | prompt plano | 0/16 | 16/16 | 0 | 21 | 0 | 0 | 39 | 0 | 1 min | 30 / 249,1k / 18,3k | 0,25 $ |
| b-3 | prompt plano | 6/16 | 16/16 | 0 | 21 | 0 | 0 | 39 | 0 | 1 min | 993 / 249,1k / 18,8k | 0,25 $ |

- **Global a mano**: el recuento del agente leyendo cada informe entero, con el ID en cualquier formato (`!13`,
  `#105`, `tarea 105`, `PR 13`, o el número solo en una tabla de tareas). Ningún informe nombra un ID que no esté en
  el snapshot (`PR 7` sí está: es la PR de `WI #107`).
- **Tiempo, tokens y coste**: del informe de uso de Claude Code de cada chat ("Wall", "Session" y "Cost"), que la
  persona copió a mano ([`evidencias/eval-uso.md`](evidencias/eval-uso.md)). "0m" se escribe "< 1 min".
- En (b), "Sugerencias sin hecho" sale 0 porque el verificador no encuentra la sección Sugerencias, no porque se
  cumpla.

## Análisis

**Exactitud de los hechos.** Las dos variantes dan los 16 IDs esperados y no inventan ninguno. Las 5 señales de
riesgo también coinciden: `PR #13` envejecida, `PR #5` con cambios pedidos, `WI #114` estancada, `WI #116`
bloqueada sin motivo y `WI #117` bloqueada con su motivo. Los IDs y las señales son los mismos. El siguiente paso no:
b-1 y b-2 fallan en 7 tareas (ver abajo). Las 39 comprobaciones de caso que fallan en (b) son del verificador, que no
encuentra las secciones de la plantilla; no se han contado a mano.

**Dónde está la diferencia:**
- **Estabilidad.** Los Hechos de a-1, a-2 y a-3 son idénticos línea a línea; solo cambia la redacción de las
  Sugerencias 6–10. Cada informe b tiene otra estructura: secciones con emojis, tablas o listas, y un resumen con
  contadores, al final en b-1 y b-2 y como tabla al principio en b-3.
- **Comprobable con código.** Solo (a) lo comprueba el verificador sin intervención: los IDs con formato fijo y
  las secciones de la plantilla. En (b), el número del verificador (0/16) no mide nada; hay que leer el informe
  entero.
- **Hechos separados de Sugerencias.** (a) los separa siempre, como exige `CLAUDE.md`. (b) mezcla los datos con
  prioridades y consejos ("Lo primero de hoy", "Para hoy, son rápidas").
- **"Sin datos" frente a deducir.** El snapshot no trae siguiente paso (`nextStep: null`) para `WI #101`, `#102`,
  `#103`, `#114`, `#116` y `#117`. (a) lo deja sin siguiente paso. b-1 y b-2 se lo inventan ("Empezar", "Seguir
  trabajando", "Desbloquear", "Esperar credenciales"…). "Empezar" es justo un paso que se retiró del glosario. b-1 y
  b-2 también cambian el de `WI #104`: el snapshot dice "Esperar revisión" y ellos ponen "Asignar revisor". b-3 no
  pone columna de siguiente paso y lo da como consejo.
- **Vocabulario del glosario.** (a) usa los términos de `docs/glosario.md` ("PR envejecida", "PR propia
  bloqueada", "tarea estancada"). (b) dice "antigua", "parada" o "con cambios pedidos". Los tres ponen `PR #5` entre
  lo primero del día, pero no en sus bloqueos ni en sus avisos. b-3 explica que la tarea 105 no está bloqueada y
  por eso no la cuenta entre las bloqueadas.
- **Lo que (b) ve y (a) no.** Los tres informes b avisan de que `PR #4` no tiene revisores (`reviewers: []` en
  el snapshot, cierto), así que "Esperar revisión" no va a pasar. (a) solo pone "sin votos". El glosario no tiene
  esa señal.
- **Inferencias sin base en el snapshot.** "Frena a tu compañero" (b-3) y "desbloqueas a otros" (b-1). Son
  plausibles, porque el autor es el compañero, pero no son un hecho.

**Coste.** (a) cuesta entre 0,47 y 0,66 $ por informe y (b) entre 0,25 y 0,32 $: unas dos veces más con la skill.
La diferencia está en el contexto leído (cache read 536k–889k frente a 240k–249k): en el repositorio se cargan
`CLAUDE.md`, la skill y el resto del contexto del proyecto. En (a), la sesión además propone primero el modo plan
(ver Límites). La salida es parecida: ≈ 700 tokens en (a) y ≈ 1 000 en b-1 y b-3 (b-2 marca 30, ver Límites). El
tiempo va de 1 a 2 minutos en (a) y es de 1 minuto o menos en (b).

**Conclusión.** Sobre un snapshot que ya trae las señales calculadas, el prompt plano da los mismos IDs y las mismas
5 señales de riesgo. Dos de sus tres informes rellenan siguientes pasos que el snapshot no trae.
La skill aporta otra cosa: un formato fijo que se comprueba con código, informes estables entre ejecuciones, Hechos
separados de Sugerencias y no deducir lo que falta. Esas propiedades son las que permiten el verificador. El precio
es unas dos veces el coste por informe.

## Evidencias

`output/` no se versiona, así que la evidencia del eval está en [`docs/evidencias/`](evidencias/):
- Informes: capturas `eval-a-1-informe.png` … `eval-b-3-informe.png`, una por ejecución.
- Verificador: salida completa de `npm run verify:brief -- --fixtures` sobre a-1
  ([`eval-a-1-verify.md`](evidencias/eval-a-1-verify.md)) y b-1 ([`eval-b-1-verify.md`](evidencias/eval-b-1-verify.md)).
  Las otras dos de cada variante dan los mismos números (tabla de arriba).
- Uso: [`eval-uso.md`](evidencias/eval-uso.md) (captura en `eval-uso.png`), con tiempo, tokens y coste de las 6
  ejecuciones y la media de cada variante.

## Límites

- La medida global solo reconoce `PR #n` y `WI #n`. Si el prompt plano escribe "work item 116" o "#116", cuenta como
  omisión. Hay que anotarlo en la fila y, si pasa, contarlo a mano aparte, sin cambiar el número del verificador.
- En (b), las columnas por sección salen casi todas como omisión porque no usa los encabezados. Mide si sigue la
  plantilla, no si acierta los hechos; para comparar las dos variantes vale la medida global.
- 3 ejecuciones por variante dan una idea de la variación, no una estadística.
- Fixtures, no datos reales: mide la síntesis sobre casos conocidos, no la recogida contra la API.
- La exactitud de (b) depende de que el snapshot ya traiga las señales calculadas (`aged`, `blocked`, `stale`,
  `nextStep`). El eval no mide qué pasaría si la IA tuviera que calcularlas.
- Los prompts no fueron exactamente los de la tabla. En (a): "hazme el informe diario", "hazme el reporte diario" y
  "realiza el informe del dia". En (b) se añadió "del snapshot" a esas tres frases, en vez de "resume mi día a partir
  de snapshot.json". Las tres variantes de (a) cargaron la skill.
- En (a), la sesión propuso primero el modo plan (`"defaultMode": "plan"` en `.claude/settings.json`). Eso suma
  tiempo y tokens que la skill sola no gastaría.
- Ningún modelo escribió archivos: la persona copió cada informe y los datos de uso a mano. Los informes b se
  hicieron con los a ya fuera de la carpeta (confirmado por la persona).
- b-2 marca 30 tokens de salida para un informe de unos 3 KB. Se anota tal cual; no se ha averiguado por qué.
