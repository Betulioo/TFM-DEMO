# Medición

Línea base manual (paso 0) y medición con la herramienta (paso 9). La usa el cálculo de negocio (paso 11).
Aquí se separa lo **medido** de lo **estimado** y lo **percibido** (`docs/plan.md`, paso 9; `docs/enunciado-tfm.md`).

## Reglas

- **Sin datos del cliente.** Solo números y categorías genéricas: ni IDs, ni títulos, ni nombres de personas,
  repositorios o proyectos, ni capturas. Los datos de cliente no se pasan a la IA (`CLAUDE.md`, Reglas).
- La medición del cliente la hace la persona. El agente no ve el proyecto del cliente.
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

Medido por la persona: 2 días laborables de los 5 previstos (decisión de la persona: solo puede hacer dos). Ninguno
es después de un fin de semana. Ver "Supuestos y límites".

| Fecha | Día | Minutos | PRs mías | PRs equipo | Tareas | Sitios | Cambios de contexto | Interrupciones | Omisiones | Dispersión (1–5) | Notas (sin datos del cliente) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-22 | jueves | 1 | 0 | 2 | 0 | 3 | 1 | sin datos | 0 | 2 | PRs propias (las que ha creado): 0. En PRs equipo apuntó «2, 2» y cuenta el segundo. Sitios: lista de PRs, la PR y el tablero (ahí busca su tarea). Cambio de contexto: ver un comentario en una PR. |
| 2026-10-23 | viernes | 2-3 | 2 | 2 | 2 | 3 | 1 | sin datos | 0 | 3 | PRs propias (las que ha creado): 1. En PRs equipo apuntó «4, 2» y cuenta el segundo. Sitios y cambio de contexto, como el día anterior. |

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

Medido por la persona: 2 usos completos (ejecutar, leer el informe y decidir) de los 3 previstos, con las mismas
columnas para comparar lo mismo. La demo tiene menos volumen que el cliente, así que la comparación se apoya en
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
| Centralización | Sitios consultados (mediana) | 3 | 1 | Medido |
| Menos distracciones | Cambios de contexto (mediana) | 1 | sin datos | Medido |
| Menos omisiones | Omisiones (total) | 0 | sin datos | Medido |
| Foco | Dispersión 1–5 (mediana) | 2,5 | 1 | Percibido |
| En segundo plano | Se puede lanzar mientras se hace otra cosa (en una reunión, al final de la tarde) y solo se dedica atención a leer el informe | No: hay que recorrer las pantallas | Sí | Percibido (no se midió el tiempo atento por separado) |
| Registro | Cada informe queda guardado con su fecha (`output/brief-AAAA-MM-DD.md`) para comparar días o ver cómo cerró el sprint | No | Sí, en el equipo de la persona (`output/` no se versiona) | Percibido |

## Supuestos y límites

- **Paso 0 con 2 días, no 5.** Ninguno es después de un fin de semana. Con dos mediciones no se ve cuánto cambia
  el tiempo de un día a otro: el resumen describe esos dos días y no es una línea base fiable.
- **Volumen bajo esos días:** de 0 a 2 PRs pendientes de mi revisión y de 0 a 2 tareas. Con más volumen, el
  tiempo manual probablemente sube; no está medido.
- **Omisiones:** 0 en los dos días. La persona dice que a veces llega a la daily sin haber revisado las PRs, pero
  no pasó en los días medidos. Es percibido, no medido.
- **Interrupciones:** no se apuntaron ("sin datos").
- **Paso 9 con 2 usos, no 3,** los dos el mismo día. Cambios de contexto, interrupciones y omisiones no se
  apuntaron, así que esos beneficios no se pueden comparar.
- **El tiempo no mejora de forma relevante:** 1,5 min con la herramienta frente a 1,75 min a mano (medianas), con
  pocos datos y volúmenes distintos (demo frente a cliente). Según la persona, la mejora está en centralizar y en
  poder lanzarlo en segundo plano, no en el tiempo.
- (Se completa en el paso 11: perfil, coste por hora, condiciones de la comparación y diferencias de volumen entre
  la demo y el cliente.)
