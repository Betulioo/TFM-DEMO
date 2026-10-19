# azdo-daily-brief

Herramienta que genera un **informe diario** para un desarrollador a partir de Azure DevOps:
PRs que esperan su revisión, sus tareas de la iteración actual y qué le falta a cada una.
Es el caso práctico de un TFM: el código debe ser simple, verificable y reutilizable.

**Al empezar cada sesión** lee `docs/bitacora.md` (estado y decisiones) y `docs/plan.md` (diseño de los
pasos pendientes). Se trabaja un paso cada vez; al terminar uno, actualiza la bitácora.

### Bitácora (`docs/bitacora.md`)

- **Estado** (casillas) y **Próximo paso**: foto vigente; se reemplazan, no se acumulan.
- **Registro**: una entrada por fecha con *Progreso* (resultados concretos), *Decisiones* (qué y por qué),
  *Aprendizajes* (hechos comprobados) y *Errores y correcciones* (intento → por qué falló → qué cambia).
- El registro es historial y evidencia del TFM: no se poda ni se reescribe; solo se corrige lo que sea falso.
- Distingue hechos de inferencias. No escribas motivos que la persona no ha dado. Nunca tokens ni datos de cliente.

## Arquitectura

1. **Recogida (determinista, sin IA)** — `src/`: lee Azure DevOps y escribe `output/snapshot.json`.
   Sigue arquitectura hexagonal: un puerto (interfaz) con dos adaptadores, uno real para la API de
   Azure DevOps y otro falso que lee fixtures. La lógica de vinculación no conoce el adaptador.
   Capas: `src/domain` (no importa nada de fuera), `src/ports` (solo `domain`), `src/application`
   (paso 6), `src/adapters/azdo` y `src/adapters/fixtures`. `src/` nunca importa `scripts/` y solo
   `adapters/azdo/read-only-client.ts` llama a `fetch`.
2. **Síntesis (IA)** — skill en `.claude/skills/`: lee `output/snapshot.json` y redacta el informe.
3. **Verificación** — `scripts/` y tests: compara el informe con `fixtures/expected.json`.

Mantén esta separación: la IA nunca llama a la API directamente; solo interpreta el snapshot.
Los términos de dominio ("PR envejecida", "bloqueada"…) se definen en `docs/glosario.md`; úsalos tal cual.

## Reglas

- **Solo lectura** contra Azure DevOps. El cliente HTTP de `src/` solo implementa GET; no le añadas
  otros métodos. El único código que escribe es el seed del proyecto demo (`scripts/seed-*`),
  que usa su propio token y nunca debe apuntar a una organización real.
- **Ningún dato de cliente pasa por la IA.** Las cuentas de IA de este proyecto son personales:
  la skill solo se ejecuta sobre el proyecto demo o fixtures.
- **Nunca** imprimir, registrar ni commitear tokens. Las credenciales viven solo en `.env`.
- `output/` no se sube ni se copia a `docs/`.
- **No hagas commit ni push.** Los hace siempre la persona; tú deja los cambios sin commitear.
- El informe separa **Hechos** (siempre con ID: `PR #12`, `WI #345`) de **Sugerencias**.
  Si falta un dato, escribe "sin datos"; no lo deduce.

## Convenciones

- TypeScript estricto, ESM, Node ≥ 20.12. Ejecutar con `tsx`.
- `fetch` nativo, `process.loadEnvFile()` y `node:test`; no añadir dependencias sin necesidad clara.
- Código y comentarios en español sencillo; nombres de variables en inglés.

## Comandos

- `npm install` — instala dependencias y activa el hook `.githooks/pre-push` (typecheck + lint + tests).
- `npm run typecheck` — comprueba tipos.
- `npm run lint` — ESLint con las reglas de capas y de solo lectura (`eslint.config.js`).
  `typecheck`, `lint` y `npm test` deben pasar antes de dar un paso por terminado.
- `npm test` — tests con `node:test` (sin red).
- `npm run list:prs` — lista las PRs de la demo y las compara con `fixtures/demo-ids.json` (`-- --fixtures` usa el adaptador falso).
- `npm run check:conn` — comprueba la conexión con Azure DevOps usando `.env` (solo lectura).
- `npm run seed:demo` — siembra el proyecto demo con los casos de `fixtures/expected.json`. Solo para la demo:
  pide confirmación y se niega si el proyecto ya tiene work items.

## Casos de prueba

`fixtures/expected.json` es la única fuente de los casos: el seed lee `setup` y el verificador lee `expected`.
Para añadir un caso, añádelo ahí; no dupliques la lista en otro archivo.
