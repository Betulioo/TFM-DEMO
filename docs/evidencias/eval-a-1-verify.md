Informe:  output/eval/a-1.md
Snapshot: output/snapshot.json (2026-10-21T11:31:44.937Z), IDs de fixtures

Casos (expected.json):
  OK    A → inMyTasks: WI #101 en «Mis tareas»
  OK    A → nextStep: WI #101 en «Mis tareas» sin «Siguiente paso»
  OK    B → inMyTasks: WI #102 en «Mis tareas»
  OK    B → nextStep: WI #102 en «Mis tareas» sin «Siguiente paso»
  OK    C → inMyTasks: WI #103 en «Mis tareas»
  OK    C → nextStep: WI #103 en «Mis tareas» sin «Siguiente paso»
  OK    D → inMyTasks: WI #104 en «Mis tareas»
  OK    D → nextStep: WI #104 en «Mis tareas» con «Siguiente paso: Esperar revisión»
  OK    D → prIsMine: PR #4 en «Mis PRs»
  OK    D → pendingMyReview: PR #4 fuera de «PRs pendientes de mi revisión»
  OK    E → inMyTasks: WI #105 en «Mis tareas»
  OK    E → nextStep: WI #105 en «Mis tareas» con «Siguiente paso: Atender cambios solicitados»
  OK    E → prIsMine: PR #5 en «Mis PRs»
  OK    E → prBlocked: PR #5 en «Mis PRs» con «PR bloqueada»
  OK    E → prBlocked: PR #5 en «Riesgos» con «PR propia bloqueada»
  OK    E → pendingMyReview: PR #5 fuera de «PRs pendientes de mi revisión»
  OK    F → inMyTasks: WI #106 en «Mis tareas»
  OK    F → nextStep: WI #106 en «Mis tareas» con «Siguiente paso: Completar la PR»
  OK    F → prIsMine: PR #6 en «Mis PRs»
  OK    F → prApproved: PR #6 en «Mis PRs» con «PR aprobada»
  OK    F → pendingMyReview: PR #6 fuera de «PRs pendientes de mi revisión»
  OK    G → inMyTasks: WI #107 en «Mis tareas»
  OK    G → nextStep: WI #107 en «Mis tareas» con «Siguiente paso: Cerrar la tarea»
  OK    H → inMyTasks: WI #108 fuera de «Mis tareas»
  OK    I → inMyTasks: WI #109 fuera de «Mis tareas»
  OK    J → inMyTasks: WI #110 fuera de «Mis tareas»
  OK    K → pendingMyReview: PR #11 en «PRs pendientes de mi revisión»
  OK    L → pendingMyReview: PR #12 fuera de «PRs pendientes de mi revisión»
  OK    M → pendingMyReview: PR #13 en «PRs pendientes de mi revisión»
  OK    M → aged: PR #13 en «PRs pendientes de mi revisión» con «PR envejecida»
  OK    M → aged: PR #13 en «Riesgos» con «PR envejecida pendiente de mi revisión»
  OK    N → inMyTasks: WI #114 en «Mis tareas»
  OK    N → nextStep: WI #114 en «Mis tareas» sin «Siguiente paso»
  OK    N → stale: WI #114 en «Mis tareas» con «tarea estancada»
  OK    N → stale: WI #114 en «Riesgos» con «tarea estancada»
  OK    O → pendingMyReview: PR #15 fuera de «PRs pendientes de mi revisión»
  OK    O → pendingTeamReview: PR #15 en «PRs pendientes del equipo»
  OK    P → inMyTasks: WI #116 en «Mis tareas»
  OK    P → nextStep: WI #116 en «Mis tareas» sin «Siguiente paso»
  OK    P → taskBlocked: WI #116 en «Mis tareas» con «tarea bloqueada»
  OK    P → taskBlocked: WI #116 en «Riesgos» con «tarea bloqueada»
  OK    P → taskBlocked: WI #116 en «Mis tareas» con «motivo: sin datos»
  OK    Q → inMyTasks: WI #117 en «Mis tareas»
  OK    Q → nextStep: WI #117 en «Mis tareas» sin «Siguiente paso»
  OK    Q → taskBlocked: WI #117 en «Mis tareas» con «tarea bloqueada»
  OK    Q → taskBlocked: WI #117 en «Riesgos» con «tarea bloqueada»
  OK    Q → lockReason: WI #117 en «Mis tareas» con «motivo: Esperando credenciales del entorno de pruebas»

Por sección:
  OK    PRs pendientes de mi revisión: 2 aciertos, 0 omisiones, 0 mal clasificados, 0 inventados
  OK    PRs pendientes del equipo: 1 aciertos, 0 omisiones, 0 mal clasificados, 0 inventados
  OK    Mis PRs: 3 aciertos, 0 omisiones, 0 mal clasificados, 0 inventados
  OK    Mis tareas: 10 aciertos, 0 omisiones, 0 mal clasificados, 0 inventados
  OK    Riesgos: 5 aciertos, 0 omisiones, 0 mal clasificados, 0 inventados

Sugerencias (cada ID debe estar en Hechos):
  OK    todas citan hechos

Global (IDs en cualquier parte del informe; para comparar con el prompt plano, no cuenta como fallo):
  aciertos 16/16
  omisiones: ninguno
  inventados: ninguno

Todo coincide.