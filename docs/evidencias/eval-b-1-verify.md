Informe:  output/eval/b-1.md
Snapshot: output/snapshot.json (2026-10-21T11:31:44.937Z), IDs de fixtures
AVISO: el informe es de sin fecha y el snapshot de 2026-10-21.

Casos (expected.json):
  FALLO A → inMyTasks: WI #101 en «Mis tareas» — no está
  FALLO A → nextStep: WI #101 en «Mis tareas» sin «Siguiente paso» — no está
  FALLO B → inMyTasks: WI #102 en «Mis tareas» — no está
  FALLO B → nextStep: WI #102 en «Mis tareas» sin «Siguiente paso» — no está
  FALLO C → inMyTasks: WI #103 en «Mis tareas» — no está
  FALLO C → nextStep: WI #103 en «Mis tareas» sin «Siguiente paso» — no está
  FALLO D → inMyTasks: WI #104 en «Mis tareas» — no está
  FALLO D → nextStep: WI #104 en «Mis tareas» con «Siguiente paso: Esperar revisión» — no está
  FALLO D → prIsMine: PR #4 en «Mis PRs» — no está
  OK    D → pendingMyReview: PR #4 fuera de «PRs pendientes de mi revisión»
  FALLO E → inMyTasks: WI #105 en «Mis tareas» — no está
  FALLO E → nextStep: WI #105 en «Mis tareas» con «Siguiente paso: Atender cambios solicitados» — no está
  FALLO E → prIsMine: PR #5 en «Mis PRs» — no está
  FALLO E → prBlocked: PR #5 en «Mis PRs» con «PR bloqueada» — no está
  FALLO E → prBlocked: PR #5 en «Riesgos» con «PR propia bloqueada» — no está
  OK    E → pendingMyReview: PR #5 fuera de «PRs pendientes de mi revisión»
  FALLO F → inMyTasks: WI #106 en «Mis tareas» — no está
  FALLO F → nextStep: WI #106 en «Mis tareas» con «Siguiente paso: Completar la PR» — no está
  FALLO F → prIsMine: PR #6 en «Mis PRs» — no está
  FALLO F → prApproved: PR #6 en «Mis PRs» con «PR aprobada» — no está
  OK    F → pendingMyReview: PR #6 fuera de «PRs pendientes de mi revisión»
  FALLO G → inMyTasks: WI #107 en «Mis tareas» — no está
  FALLO G → nextStep: WI #107 en «Mis tareas» con «Siguiente paso: Cerrar la tarea» — no está
  OK    H → inMyTasks: WI #108 fuera de «Mis tareas»
  OK    I → inMyTasks: WI #109 fuera de «Mis tareas»
  OK    J → inMyTasks: WI #110 fuera de «Mis tareas»
  FALLO K → pendingMyReview: PR #11 en «PRs pendientes de mi revisión» — no está
  OK    L → pendingMyReview: PR #12 fuera de «PRs pendientes de mi revisión»
  FALLO M → pendingMyReview: PR #13 en «PRs pendientes de mi revisión» — no está
  FALLO M → aged: PR #13 en «PRs pendientes de mi revisión» con «PR envejecida» — no está
  FALLO M → aged: PR #13 en «Riesgos» con «PR envejecida pendiente de mi revisión» — no está
  FALLO N → inMyTasks: WI #114 en «Mis tareas» — no está
  FALLO N → nextStep: WI #114 en «Mis tareas» sin «Siguiente paso» — no está
  FALLO N → stale: WI #114 en «Mis tareas» con «tarea estancada» — no está
  FALLO N → stale: WI #114 en «Riesgos» con «tarea estancada» — no está
  OK    O → pendingMyReview: PR #15 fuera de «PRs pendientes de mi revisión»
  FALLO O → pendingTeamReview: PR #15 en «PRs pendientes del equipo» — no está
  FALLO P → inMyTasks: WI #116 en «Mis tareas» — no está
  FALLO P → nextStep: WI #116 en «Mis tareas» sin «Siguiente paso» — no está
  FALLO P → taskBlocked: WI #116 en «Mis tareas» con «tarea bloqueada» — no está
  FALLO P → taskBlocked: WI #116 en «Riesgos» con «tarea bloqueada» — no está
  FALLO P → taskBlocked: WI #116 en «Mis tareas» con «motivo: sin datos» — no está
  FALLO Q → inMyTasks: WI #117 en «Mis tareas» — no está
  FALLO Q → nextStep: WI #117 en «Mis tareas» sin «Siguiente paso» — no está
  FALLO Q → taskBlocked: WI #117 en «Mis tareas» con «tarea bloqueada» — no está
  FALLO Q → taskBlocked: WI #117 en «Riesgos» con «tarea bloqueada» — no está
  FALLO Q → lockReason: WI #117 en «Mis tareas» con «motivo: Esperando credenciales del entorno de pruebas» — no está

Por sección:
  FALLO PRs pendientes de mi revisión: 0 aciertos, 2 omisiones, 0 mal clasificados, 0 inventados — omisiones: PR #11, PR #13
  FALLO PRs pendientes del equipo: 0 aciertos, 1 omisiones, 0 mal clasificados, 0 inventados — omisiones: PR #15
  FALLO Mis PRs: 0 aciertos, 3 omisiones, 0 mal clasificados, 0 inventados — omisiones: PR #4, PR #5, PR #6
  FALLO Mis tareas: 0 aciertos, 10 omisiones, 0 mal clasificados, 0 inventados — omisiones: WI #101, WI #102, WI #103, WI #104, WI #105, WI #106, WI #107, WI #114, WI #116, WI #117
  FALLO Riesgos: 0 aciertos, 5 omisiones, 0 mal clasificados, 0 inventados — omisiones: PR #5, PR #13, WI #114, WI #116, WI #117

Sugerencias (cada ID debe estar en Hechos):
  OK    todas citan hechos

Global (IDs en cualquier parte del informe; para comparar con el prompt plano, no cuenta como fallo):
  aciertos 0/16
  omisiones: PR #11, PR #13, PR #15, PR #4, PR #5, PR #6, WI #101, WI #102, WI #103, WI #104, WI #105, WI #106, WI #107, WI #114, WI #116, WI #117
  inventados: ninguno

60 comprobación(es) no coinciden.