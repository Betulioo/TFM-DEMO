# Eval: uso por ejecución

Del informe de uso de Claude Code de cada chat, copiado a mano por la persona (2026-10-21, Opus 5.5). Snapshot de
fixtures del mismo día (11:31 UTC). Análisis en [`docs/eval.md`](../eval.md).

| Ejecución | Variante | Prompt | Informe de uso (UTC) | Tiempo | Tokens in | Tokens out | Cache read | Cache write | Coste |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| a-1 | skill | hazme el informe diario | 11:43:54 | 2 min | 22 | 769 | 888,5k | 42,2k | 0,66 $ |
| a-2 | skill | hazme el reporte diario | 11:48:11 | 1 min | 16 | 697 | 607,8k | 30,6k | 0,47 $ |
| a-3 | skill | realiza el informe del dia | 11:49:55 | 1 min | 14 | 695 | 535,9k | 36,8k | 0,51 $ |
| b-1 | prompt plano | hazme el informe diario del snapshot | 11:56:27 | < 1 min | 8 | 996 | 239,7k | 27,7k | 0,32 $ |
| b-2 | prompt plano | hazme el reporte diario del snapshot | 12:02:31 | 1 min | 8 | 30 | 249,1k | 18,3k | 0,25 $ |
| b-3 | prompt plano | realiza el informe del dia del snapshot | 12:04:31 | 1 min | 8 | 993 | 249,1k | 18,8k | 0,25 $ |
| **Media (a)** | skill | | | | 17 | 720 | 677,4k | 36,5k | **0,55 $** |
| **Media (b)** | prompt plano | | | | 8 | 673 | 246,0k | 21,6k | **0,27 $** |

- Tiempo: "Wall" del informe de uso. "0m" se escribe "< 1 min".
- (a) en este repositorio; (b) en una carpeta aparte con solo una copia del snapshot. En las notas de la persona,
  b-1, b-2 y b-3 se llaman "Run 4", "Run 2" y "Run 3" del bloque "Carpeta aparte".
- b-2 marca 30 tokens de salida para un informe de unos 3 KB; se copia tal cual. Su media de salida (673) lo incluye.
- No se copian los límites del plan ni la actividad local: no son de cada ejecución.
