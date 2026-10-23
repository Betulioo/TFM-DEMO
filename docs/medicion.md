# Medición

Línea base manual (paso 0) y medición con la herramienta (paso 9). La usa el cálculo de negocio (paso 11).
Aquí se separa lo **medido** de lo **estimado** y lo **percibido** (`docs/plan.md`, paso 9; `docs/enunciado-tfm.md`).

## Reglas

- **Sin datos del cliente.** Solo números y categorías genéricas: ni IDs, ni títulos, ni nombres de personas,
  repositorios o proyectos, ni capturas. Los datos de cliente no se pasan a la IA (`CLAUDE.md`, Reglas).
- La medición del cliente la hago yo. El agente no ve el proyecto del cliente.
- Un dato que no se apuntó se deja como "sin datos"; no se rellena después de memoria.

## Qué se mide

**Rutina:** preparar el día en Azure DevOps. Es decir, ver qué PRs esperan mi revisión o la de mi equipo, repasar
mis tareas de la iteración y decidir qué le falta a cada una y por dónde empiezo.

- **Inicio:** abro Azure DevOps o lo primero que consulte para la rutina.
- **Fin:** sé qué revisar y qué hacer primero.
- **Cuántas veces:** al menos 5 días laborables distintos, incluido uno después de un fin de semana. El tiempo
  varía de un día a otro, y una sola medición no lo recoge.

| Columna | Qué se apunta | Para qué |
|---|---|---|
| Minutos | De inicio a fin, con cronómetro | Tiempo |
| PRs mías | PRs pendientes de mi revisión | Volumen |
| PRs equipo | PRs pendientes del equipo | Volumen |
| Tareas | Mis tareas de la iteración | Volumen |
| Sitios | Pantallas o herramientas distintas consultadas (lista de PRs, tablero, cada work item, notificaciones, correo, chat…) | Centralización |
| Cambios de contexto | Veces que acabo en algo ajeno a la rutina (otra conversación, otra PR, otra tarea…) | Distracciones |
| Interrupciones | Interrupciones externas durante la rutina (llamada, mensaje, alguien que pregunta) | Distracciones (no dependen de la herramienta) |
| Omisiones | Cosas de la rutina que se me pasaron y descubrí después ese día (una PR sin revisar, una tarea bloqueada…) | Calidad |
| Dispersión (1–5) | Opcional. Sensación de dispersión: 1 = enfocado, 5 = muy disperso | Percepción |

Los términos ("PR pendiente de mi revisión", "PR pendiente del equipo", "Mis tareas", "tarea bloqueada") son los
de [`docs/glosario.md`](glosario.md).

## Paso 0: rutina manual en el cliente

Lo medí yo: 2 días laborables de los 5 previstos, porque solo pude hacer dos. Ninguno es después de un fin de
semana. Ver "Supuestos y límites".

| Fecha | Día | Minutos | PRs mías | PRs equipo | Tareas | Sitios | Cambios de contexto | Interrupciones | Omisiones | Dispersión (1–5) | Notas (sin datos del cliente) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-22 | jueves | 1 | 0 | 2 | 0 | 3 | 1 | sin datos | 0 | 2 | PRs propias (las que he creado): 0. En PRs equipo apunté «2, 2» y cuenta el segundo. Sitios: lista de PRs, la PR y el tablero (ahí busco mi tarea). Cambio de contexto: ver un comentario en una PR. |
| 2026-10-23 | viernes | 2-3 | 2 | 2 | 2 | 3 | 1 | sin datos | 0 | 3 | PRs propias (las que he creado): 1. En PRs equipo apunté «4, 2» y cuenta el segundo. Sitios y cambio de contexto, como el día anterior. |

### Resumen del paso 0

Se usa la mediana y no la media: el tiempo varía, y un día atípico no debe pesar más que los demás. Con dos
mediciones, la mediana es la media de las dos. Los minutos «2-3» cuentan como 2,5.

| Columna | Mediciones | Mínimo | Mediana | Máximo |
|---|---|---|---|---|
| Minutos | 2 | 1 | 1,75 | 2,5 |
| PRs mías | 2 | 0 | 1 | 2 |
| PRs equipo | 2 | 2 | 2 | 2 |
| Tareas | 2 | 0 | 1 | 2 |
| Sitios | 2 | 3 | 3 | 3 |
| Cambios de contexto | 2 | 1 | 1 | 1 |
| Interrupciones | 0 | sin datos | sin datos | sin datos |
| Omisiones | 2 | 0 | 0 | 0 |
| Dispersión (1–5) | 2 | 2 | 2,5 | 3 |

## Paso 9: con la herramienta sobre la demo

Lo medí yo: 2 usos completos (ejecutar, leer el informe y decidir) de los 3 previstos, con las mismas columnas
para comparar lo mismo. La demo tiene menos volumen que el cliente, así que la comparación se apoya en
supuestos que se explican en el paso 11.

| Fecha | Día | Minutos | PRs mías | PRs equipo | Tareas | Sitios | Cambios de contexto | Interrupciones | Omisiones | Dispersión (1–5) | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-23 | viernes (mañana) | 1-2 | 1 | 0 | 7 | 1 | sin datos | sin datos | sin datos | 1 | Solo el informe, sin abrir nada más. Los volúmenes son los de la demo ese día, tomados del snapshot de las 11:29 UTC. |
| 2026-10-23 | viernes (tarde) | 1-2 | 1 | 0 | 7 | 1 | sin datos | sin datos | sin datos | 1 | Como el de la mañana. |

### Resumen del paso 9

Con dos mediciones, la mediana es la media de las dos. Los minutos «1-2» cuentan como 1,5.

| Columna | Mediciones | Mínimo | Mediana | Máximo | Paso 0 (mediana) |
|---|---|---|---|---|---|
| Minutos | 2 | 1,5 | 1,5 | 1,5 | 1,75 |
| Sitios | 2 | 1 | 1 | 1 | 3 |
| Dispersión (1–5) | 2 | 1 | 1 | 1 | 2,5 |

Cambios de contexto, interrupciones y omisiones no se apuntaron ("sin datos").

## Beneficios además del tiempo

La herramienta no solo busca ahorrar minutos. También busca tener todo **centralizado** en un informe y trabajar
**con menos distracciones**. Cada valor se marca como medido o percibido.

| Beneficio | Indicador | Manual (paso 0) | Con la herramienta (paso 9) | Tipo |
|---|---|---|---|---|
| Centralización | Sitios consultados (mediana) | 3 | 1 | Medido (el 3 lo contó el agente a partir de mi descripción del recorrido) |
| Menos distracciones | Cambios de contexto (mediana) | 1 | sin datos | Medido |
| Menos omisiones | Omisiones (total) | 0 | sin datos | Medido |
| Foco | Dispersión 1–5 (mediana) | 2,5 | 1 | Percibido |
| En segundo plano | Se puede lanzar mientras se hace otra cosa (en una reunión, al final de la tarde) y solo se dedica atención a leer el informe | No: hay que recorrer las pantallas | Sí | Percibido (no se midió el tiempo atento por separado) |
| Registro | Cada informe queda guardado con su fecha (`output/brief-AAAA-MM-DD.md`) para comparar días o ver cómo cerró el sprint | No | Sí, en mi equipo (`output/` no se versiona) | Percibido |

## Paso 11: cálculo de negocio

Cada dato lleva su tipo: **medido** (pasos 0 y 9, eval), **dato mío** o **supuesto**.

### Datos de partida

| Dato | Valor | Tipo |
|---|---|---|
| Perfil | Desarrollador junior | Dato mío |
| Coste por hora | 12 € | Dato mío |
| Usos al día | 2 (por ejemplo, antes de la daily y al final de la tarde) | Dato mío |
| Días laborables | 21 al mes (el año se calcula como 12 meses) | Supuesto |
| Minutos por uso, a mano | 1,75 (mediana del paso 0) | Medido |
| Minutos por uso, con la herramienta | 1,5 (mediana del paso 9) | Medido |
| Coste de IA por informe con la skill | 0,55 $ de media (0,47–0,66 $), equivalente de API que muestra Claude Code | Medido (eval) |
| Forma de pago de Claude | Suscripción Pro: cuota fija, sin cargo por informe | Dato mío |
| Cuota Pro | 20 €/mes | Dato mío |
| Cambio (solo para el coste de API, que Claude Code da en dólares) | 1 $ ≈ 0,90 € | Supuesto |
| Horas de construcción | 10–20 h: 5 días con commits (19–23 de octubre) a 2–4 h por día | Dato mío (2–4 h por día, de memoria); los días salen de `git log` |

### Construcción (una vez)

| Concepto | Cálculo | Coste |
|---|---|---|
| Mis horas | 10–20 h × 12 €/h | 120–240 € |
| Claude durante la construcción | 1 mes de Pro | 20 € |
| **Total** | | **140–260 €** |

### Uso (cada mes)

| Concepto | A mano | Con la herramienta |
|---|---|---|
| Minutos al mes (2 usos × 21 días) | 73,5 | 63 |
| Coste del tiempo (12 €/h) | 14,70 € | 12,60 € |
| Coste de IA, si la suscripción ya se tiene para otro trabajo | — | 0 € adicional |
| Coste de IA, si la suscripción se paga solo para esto | — | 20 € |
| Coste de IA en pago por uso (0,55 $ × 42 informes × 0,90) | — | ≈ 20,80 € |

**Ahorro de tiempo:** 0,25 min por uso, 10,5 min al mes. Son **2,10 € al mes** y **25,20 € al año**.

### Resultado

- **Por tiempo, la herramienta no se justifica.**
  - Con la suscripción ya pagada, ahorra unos 2 € al mes. La construcción (140–260 €) tardaría entre 5,6 y 10,3
    años en amortizarse solo con ese ahorro (de 67 a 124 meses).
  - Si la suscripción o el pago por uso fueran solo para esto, cuesta más de lo que ahorra (20–21 € frente a
    2,10 € al mes).
- **Punto de equilibrio** (estimado, no medido):
  - En pago por uso, cada informe cuesta ≈ 0,50 €, que a 12 €/h son 2,5 minutos de trabajo. La rutina manual
    tendría que durar unos 4 minutos (2,5 más que con la herramienta) para cubrir el coste de IA.
  - Con la cuota Pro dedicada (20 € entre 42 informes ≈ 0,48 € por informe), harían falta ≈ 2,4 minutos ahorrados
    por uso.
  - Con los volúmenes medidos (0–2 PRs y 0–2 tareas al día) no se llega. Con más volumen la rutina manual crece y
    la herramienta tarda casi lo mismo, pero no se ha medido.
- **Lo que sí mejora no está en euros:** de 3 sitios a 1 (medido), dispersión de 2,5 a 1 (percibido), y la
  posibilidad de lanzarlo en segundo plano y de guardar un registro por fecha (percibidos). Ahí sitúo yo el
  valor de la herramienta.

## Supuestos y límites

- **Paso 0 con 2 días, no 5.** Ninguno es después de un fin de semana. Con dos mediciones no se ve cuánto cambia
  el tiempo de un día a otro: el resumen describe esos dos días y no es una línea base fiable.
- **Volumen bajo esos días:** de 0 a 2 PRs pendientes de mi revisión y de 0 a 2 tareas. Con más volumen, el
  tiempo manual probablemente sube; no está medido.
- **Omisiones:** 0 en los dos días. A veces llego a la daily sin haber revisado las PRs, pero no pasó en los
  días medidos. Es percibido, no medido.
- **Interrupciones:** no se apuntaron ("sin datos").
- **Paso 9 con 2 usos, no 3,** los dos el mismo día. Cambios de contexto, interrupciones y omisiones no se
  apuntaron, así que esos beneficios no se pueden comparar.
- **El tiempo no mejora de forma relevante:** 1,5 min con la herramienta frente a 1,75 min a mano (medianas), con
  pocos datos y volúmenes distintos (demo frente a cliente). Para mí, la mejora está en centralizar y en poder
  lanzarlo en segundo plano, no en el tiempo.
- **Condiciones de la comparación:** la rutina manual se midió en el cliente y la herramienta, en la demo. Los
  volúmenes no son iguales: en la demo, 1 PR pendiente de mi revisión y 7 tareas; en el cliente, 0–2 y 0–2. La
  demo tenía más tareas, así que no favorece a la herramienta, pero no es la misma situación.
- **Horas de construcción de memoria**, no medidas: no se apuntaron. Incluyen el arnés (`CLAUDE.md`, skills,
  lint, CI). El arnés es la base para que cualquiera adapte la herramienta con ayuda de la IA
  (por ejemplo, un informe editable), así que su coste no se debe repartir solo entre los informes de hoy.
- **La herramienta no está completa:** mi idea es que el informe sea editable por cada persona. Ese uso futuro no
  está construido ni medido, y el cálculo no lo incluye.
- **Coste de IA:** el "Cost" de Claude Code es un equivalente de API. Con la suscripción Pro no se cobra por
  informe, pero la suscripción tiene límites de uso que no se han medido.
