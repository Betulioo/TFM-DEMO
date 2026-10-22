# ADR 001 · Recogida determinista: la IA no llama a Azure DevOps

Estado: aceptada (decisión en la bitácora, 2026-10-19; ADR escrito el 2026-10-22).

El informe diario necesita datos de Azure DevOps (PRs, work items, vinculación entre ellos) y una redacción que
priorice qué hacer. Se decide separar las dos cosas: la **recogida** es código TypeScript sin IA que lee la API con
un token de solo lectura y escribe `output/snapshot.json`; la **síntesis** (skill `daily-brief`) solo lee ese
snapshot. También las reglas (siguiente paso, PR envejecida, tarea estancada o bloqueada, vinculación work item ↔
PR) se calculan en código, según `docs/glosario.md`. El motivo: así el resultado de la IA se puede comprobar contra
datos que no dependen de ella (`npm run verify:brief`, `docs/eval.md`), el token no pasa por la IA y la solo lectura
la comprueban el lint y `test/architecture.test.ts`.

**Alternativas rechazadas**
- Que la IA consulte la API directamente, por ejemplo con un MCP de Azure DevOps. El resultado no se podría
  reproducir ni comparar con un esperado, la IA necesitaría el token y vería datos del cliente.
- Que la IA calcule las reglas a partir de los datos en bruto. Son transiciones conocidas y el código las resuelve
  igual cada vez; la IA solo prioriza y redacta.

**Consecuencias**
- Una señal nueva (como "tarea bloqueada") exige cambiar el código, el glosario y `fixtures/expected.json`; la IA
  no la deduce sola.
- A cambio, la recogida tiene tests sin red (adaptador falso) y la CI la ejecuta en cada push y PR.

---
Formato: plantilla de ADR breve de la sesión 2 del track (adaptación de `ADR-FORMAT` de Matt Pocock, licencia MIT).
