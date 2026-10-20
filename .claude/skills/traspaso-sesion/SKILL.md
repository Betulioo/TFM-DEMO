---
name: traspaso-sesion
description: Deja la bitácora lista para que otra sesión continúe sin esta conversación. Úsala antes de cambiar de sesión, al terminar un paso o cuando aparece una señal de que el contexto está fallando.
---

# Traspaso de sesión

Si se usa al terminar un paso, manda la lista de cierre de [`CLAUDE.md`](../../../CLAUDE.md) (que pide corregir
lo que falle) y esta skill solo añade los pasos 3 a 5. Si se usa porque el contexto está fallando, no implementes
ni corrijas nada: solo registra el estado.

1. Ejecuta `npm run verify`. Anota el resultado; si algo falla, copia el error exacto.
2. Ejecuta `git diff --stat` y anota los archivos sin commit.
3. Actualiza `docs/bitacora.md` según su bloque
   [Cómo se escribe esta bitácora](../../../docs/bitacora.md#cómo-se-escribe-esta-bitácora): deja al día Estado,
   Próximo paso y Problemas abiertos.
4. Si en esta sesión la persona dio una instrucción solo en el chat que debe mantenerse, propón añadirla al
   `CLAUDE.md`. No la añadas sin su confirmación.
5. Mensaje final: resultado de los checks, archivos cambiados, un mensaje de commit sugerido y:
   "Haz el commit, abre una sesión nueva y usa la skill iniciar-sesion."