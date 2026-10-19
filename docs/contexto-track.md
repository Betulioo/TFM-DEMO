# Contexto del track (extraído de NotebookLM)

> Fuente: respuestas de NotebookLM sobre los notebooks del máster. Material de referencia para el documento del TFM; no es contexto para el agente.

## Track de desarrollo

1. Tipo de fuentes en el notebook
Este notebook no contiene solo cuestionarios con respuestas, sino una combinación de quizzes evaluativos con respuestas explicadas (correspondientes a las sesiones 1 a 5) y material de clase y documentación docente (skills, plantillas de refinamiento, especificaciones de ejemplo, registros de decisiones ADR, glosarios, tickets ficticios y guías sobre arneses y vídeos)
. No incluye las diapositivas completas ni las transcripciones de los vídeos, sino guías, resúmenes editoriales y enlaces a los mismos
.
A continuación se detallan las 25 fuentes presentes en el notebook con una línea de descripción cada una:
ADR-007-reglas-elegibilidad.md: Registro de decisión de arquitectura ficticio que establece resolver las reglas de elegibilidad en Content Hub
.
FUENTES.md: Documento de atribución, licencias y procedencia del material docente y adaptaciones del curso
.
Quiz · Sesión 1 · Desarrollo de software con IA.md: Cuestionario evaluativo con respuestas explicadas sobre vibe coding, arneses, AGENTS.md, CLAUDE.md y skills
.
Quiz · Sesión 2 · Desarrollo de software con IA.md: Cuestionario evaluativo sobre refinamiento de tareas, niveles de supervisión humana, comprensión del código y aportación de valor
.
Quiz · Sesión 3 · Los raíles, la parte dura del arnés.md: Cuestionario evaluativo sobre testing (unitario, integración, E2E), modelo del queso suizo, mutation testing, arquitectura hexagonal y eval de arneses
.
Quiz · Sesión 4 · La fábrica de software.md: Cuestionario evaluativo sobre subagentes, supervisores vs. equipos, loops, workflows, autonomía y fábrica de software
.
Quiz · Sesión 5 · Dónde queda el humano.md: Cuestionario evaluativo sobre glosarios, definición de tareas, refinamiento, convenciones y especificaciones vs. ejecución
.
README.md (Sesión 1 / General): Instrucciones de instalación y uso de la skill docente de bitácora en Codex y Claude Code
.
README.md (Sesión 2 / General): Guía principal del paquete de la Sesión 2 con resumen de skills docentes, skill prototype, plantillas y enlaces útiles
.
SKILL.md: Estructura e instrucciones internas de la skill docente mantener-bitacora-sesion
.
VIDEOS.md: Guía y selección de vídeos complementarios en inglés con duraciones, tramos recomendados y síntesis docente
.
agente-revisor-especificacion.md: Propuesta docente de un agente de revisión de especificaciones configurado en solo lectura
.
beneficios-tarifa.md: Especificación completa del ejemplo docente ficticio sobre la muestra de beneficios de una tarifa hotelera
.
commits-semanticos-AGENTS.md: Fragmento de guía sobre cómo redactar commits que conserven intención para incluir en AGENTS.md
.
criterios-aceptacion.md: Comparativa entre criterios de aceptación poco definidos y criterios concretos y comprobables
.
del-contexto-a-la-tarea.md: Análisis docente sobre la información que aporta cada fuente (glosario, ADR, diseños, código) al contexto de la tarea
.
enlaces-skills.md: Referencias y enlaces a skills externas (Matt Pocock, Anthropic, etc.) y repositorios de skills
.
glosario-beneficios.md: Glosario ficticio del ámbito hotelero con definiciones de términos clave
.
lo-que-ve-el-agente.md: Esquema ilustrativo de las capas de contexto que recibe un agente (System, Tools, Skills, AGENTS.md, Entorno)
.
prompt-crear-skill.md: Prompt para generar una skill a partir de las correcciones y aprendizajes de una sesión
.
referencias-arneses.md: Fuentes sobre prompts de arneses (Claude Code, Codex, OpenCode) y comparativas de rendimiento
.
reglas.md: Documento breve sobre las reglas de aplicabilidad de beneficios que enlaza al ADR-007
.
ticket-curso-materiales.md: Ejercicio en formato de ticket ficticio (CURSO-024) sobre empaquetar el material del curso en un ZIP
.
ticket-value-adds.md: Ejercicio en formato de ticket ficticio (FORM-102) sobre la funcionalidad de añadir beneficios a una tarifa
.
value-add.md: Definición conceptual breve del término Value add
.
2. Conceptos clave del track agrupados por categoría
Contexto e instrucciones del agente (CLAUDE.md, AGENTS.md, reglas, memoria)
Arnés: El sistema que rodea al modelo, compuesto por sus instrucciones, skills, gestión del contexto, herramientas y ejecución de acciones (Fuente: Quiz · Sesión 1)
.
CLAUDE.md: Archivo de instrucciones situado en la raíz del proyecto que Claude Code vuelve a cargar automáticamente tras compactar el contexto (Fuente: Quiz · Sesión 1)
.
AGENTS.md: Archivo de contexto del repositorio donde se recogen comandos de arranque, reglas importantes del proyecto y convenciones de trabajo (Fuente: Quiz · Sesión 1 y lo-que-ve-el-agente.md)
.
Bitácora de sesión / Memoria: Documento Markdown mantenido fuera del chat para conservar el estado, progreso, decisiones, aprendizajes y errores frente a la compactación del contexto (Fuente: README.md (Sesión 1) y SKILL.md)
.
Glosario de dominio: Documento consultable que recoge el vocabulario y significado propio del proyecto para que el agente use términos de forma consistente (Fuente: Quiz · Sesión 5 y glosario-beneficios.md)
.
ADR (Architecture Decision Record): Registro de decisión de arquitectura que documenta el contexto, la decisión técnica adoptada, sus consecuencias y vigencia (Fuente: Quiz · Sesión 5, ADR-007-reglas-elegibilidad.md y FUENTES.md)
.
Skills
Skill: Instrucción o procedimiento acotado y reutilizable que guía al agente en una tarea, explicando qué hace y cuándo debe utilizarse (Fuente: Quiz · Sesión 1)
.
mantener-bitacora-sesion: Skill docente para estructurar y actualizar un cuaderno de trabajo compacto frente a sesiones largas o compactaciones (Fuente: README.md (Sesión 1) y SKILL.md)
.
preparar-tarea: Skill docente para refinar peticiones ambiguas, consultar el contexto existente y redactar un borrador de especificación sin implementar (Fuente: README.md (Sesión 2))
.
init-proyecto: Skill docente que diagnostica la organización del conocimiento y recomienda la estructura de contexto y especificaciones adecuada (Fuente: README.md (Sesión 2))
.
preparar-desde-figma: Skill docente para revisar componentes, variantes de desktop/mobile, tokens y dudas de interfaz antes de implementar (Fuente: README.md (Sesión 2))
.
decisiones-tecnicas: Skill docente para localizar ADRs relevantes, identificar conflictos y proponer registros breves de decisión (Fuente: README.md (Sesión 2))
.
testing-semantico: Skill docente para revisar o redactar tests centrados en comprobar el comportamiento real mediante aserciones expresivas (Fuente: README.md (Sesión 2))
.
prototype: Skill de exploración (original de Matt Pocock) para crear prototipos de lógica o UI en un entorno aislado y responder preguntas concretas (Fuente: FUENTES.md y README.md (Sesión 2))
.
reflect: Skill docente de solo lectura para comparar la implementación final contra la especificación e identificar diferencias (Fuente: README.md (Sesión 2))
.
learn: Skill docente para extraer y proponer aprendizajes duraderos tras completar una tarea (Fuente: README.md (Sesión 2))
.
Herramientas y MCP
Herramientas (Tools): Funciones declaradas en el arnés (como ejecutar comandos, aplicar parches o buscar en la web) que el agente puede invocar (Fuente: lo-que-ve-el-agente.md)
.
Aviso de categoría: MCP (Model Context Protocol) no se define ni se desarrolla como concepto formal en las fuentes; únicamente se menciona de forma tangencial que las skills docentes no dependen de un MCP concreto (Fuente: README.md (Sesión 2))
.
Subagentes
Subagente: Agente secundario que trabaja con su propia ventana de contexto centrada en un encargo y devuelve una síntesis al supervisor (Fuente: Quiz · Sesión 4)
.
Supervisor: Agente principal que coordina, reparte e integra el trabajo de los subagentes (Fuente: Quiz · Sesión 4)
.
Verificación, arnés y evals
Modelo del queso suizo: Combinación de múltiples capas de comprobación (linters, tipos, tests) para aumentar la capacidad de detectar errores (Fuente: Quiz · Sesión 3)
.
Testing Semántico / Tests unitarios, integración y E2E: Comprobaciones en cascada de piezas aisladas, integración entre componentes reales y recorridos de usuario sobre comportamientos observables (Fuente: Quiz · Sesión 3)
.
Mutation testing: Técnica que introduce cambios en el código para encontrar huecos en la cobertura de las pruebas (Fuente: Quiz · Sesión 3)
.
Arquitectura hexagonal: Patrón que separa la aplicación de sus adaptadores externos, permitiendo simular dependencias, estados y errores en los tests (Fuente: Quiz · Sesión 3)
.
Checks de integridad arquitectónica: Comprobaciones automáticas que velan por el cumplimiento de las reglas de dependencias entre capas (Fuente: Quiz · Sesión 3)
.
Eval de arnés / configuración: Proceso de evaluación que repite la misma tarea desde el mismo punto de partida para comparar calidad, fallos, tiempo y coste entre configuraciones (Fuente: Quiz · Sesión 3 y Quiz · Sesión 4)
.
Human in the loop
Human in the loop / Responsabilidad del equipo: Principio por el cual el equipo humano conserva la responsabilidad de definir objetivos, valorar evidencias y responder de las decisiones (Fuente: Quiz · Sesión 2)
.
Nivel de supervisión: Intensidad de revisión determinada por el impacto del cambio, la incertidumbre, la capacidad de verificación y el coste de recuperación ante fallos (Fuente: Quiz · Sesión 2)
.
Flujos de trabajo y automatización
Vibe coding: Desarrollo rápido e improvisado adecuado para probar ideas que no necesitan mantenerse a largo plazo (Fuente: Quiz · Sesión 1)
.
Loop agéntico: Ciclo iterativo con feedback que repite un trabajo estableciendo límites de reintentos y gasto antes de escalar a una persona (Fuente: Quiz · Sesión 4)
.
Workflow agéntico: Proceso organizado por pasos y decisiones cuyas transiciones conocidas pueden expresarse mediante reglas en código (Fuente: Quiz · Sesión 4)
.
Fábrica de software: Sistema que integra procesos, herramientas, permisos, controles y roles para recibir trabajo y entregar resultados de forma repetible (Fuente: Quiz · Sesión 4)
.
CI/CD: Entorno de ejecución y comprobación externa obligatoria para validar el código de forma independiente al agente (Fuente: Quiz · Sesión 1 y Quiz · Sesión 3)
.
Buenas prácticas de prompting
Aviso de categoría: El concepto clásico de "prompting" no se desarrolla como una categoría o sección propia de reglas de prompt engineering en las fuentes; la formación se enfoca en la redacción de archivos de contexto (AGENTS.md, CLAUDE.md), la especificación de tareas y las instrucciones para agentes (Fuente: README.md (Sesión 2) y VIDEOS.md)
.
3. Buenas prácticas y errores comunes
(a) Cómo escribir skills
Buenas prácticas:
Descripción clara y situacional: La descripción de una skill debe explicar principalmente qué hace y en qué situaciones debe utilizarla el agente (Fuente: Quiz · Sesión 1)
.
Desarrollo interno: Los pasos detallados, recursos, referencias y ejemplos deben ir dentro del cuerpo de la skill, no en la descripción (Fuente: Quiz · Sesión 1)
.
Revisión previa de skills externas: Antes de incorporar una skill de internet, leer qué instrucciones introduce, cuándo se activa y compararla con las reglas del proyecto (Fuente: Quiz · Sesión 1 y enlaces-skills.md)
.
Copiar la carpeta completa: Para instalar una skill que contenga referencias o licencias, se debe copiar su carpeta entera y no solo el archivo SKILL.md (Fuente: README.md (Sesión 2))
.
Evaluación imparcial: Para saber si una skill es útil, se debe comparar cómo resuelve la misma tarea con y sin la skill, desde el mismo estado inicial y en chats independientes (Fuente: Quiz · Sesión 1 y Quiz · Sesión 4)
.
Creación a partir de fricciones reales: Redactar skills acotadas basadas en las correcciones y aprendizajes reales extraídos durante las sesiones de trabajo (Fuente: prompt-crear-skill.md y VIDEOS.md)
.
Errores comunes:
Suponer compatibilidad por usar el mismo stack: Dar por buena una skill solo porque use el stack del proyecto o genere código que pase los tests, sin comprobar si contradice las formas de trabajar del equipo (Fuente: Quiz · Sesión 1)
.
Confundir uso con utilidad: Creer que la skill ayuda solo porque el agente la selecciona automáticamente (Fuente: Quiz · Sesión 1 y Quiz · Sesión 4)
.
Evaluar sobre código ya corregido: Probar la skill en el mismo chat o sobre el código que ya ha sido arreglado en un intento anterior (Fuente: Quiz · Sesión 1)
.
Instalar colecciones completas sin filtrar: Copiar grandes colecciones de skills por defecto sin seleccionar las que responden a necesidades concretas (Fuente: README.md (Sesión 2) y enlaces-skills.md)
.
(b) Cómo escribir archivos de contexto como CLAUDE.md o AGENTS.md
Buenas prácticas:
Contenido relevante y específico: Incluir el comando para arrancar el proyecto (si no es el habitual), convenciones clave y reglas importantes que la IA suele saltarse (Fuente: Quiz · Sesión 1)
.
Centralización y referencias: Mantener las decisiones en una fuente autorizada (guía de arquitectura o ADR) y sustituir las copias por enlaces a esa fuente para evitar discrepancias (Fuente: Quiz · Sesión 1)
.
Distinguir persistencia: Tener presente que CLAUDE.md se vuelve a cargar automáticamente tras la compactación del contexto, mientras que las instrucciones dadas en el chat pueden perderse en el resumen (Fuente: Quiz · Sesión 1)
.
Escribir desde fallos reales: Convertir las fricciones y errores recurrentes observados al trabajar con el agente en reglas concretas para AGENTS.md (Fuente: VIDEOS.md)
.
Errores comunes:
Mezclar preferencias personales: Incluir en AGENTS.md preferencias personales de interacción con la IA, las cuales corresponden a la configuración personal del usuario (Fuente: Quiz · Sesión 1)
.
Duplicar reglas en múltiples archivos: Mantener copias de la misma regla en el README, en la guía y en skills, lo que provoca contradicciones cuando la regla cambia (Fuente: Quiz · Sesión 1)
.
Confiar únicamente en el prompt para prohibir: Asumir que poner una regla escrita en el archivo de contexto garantiza que el agente no se la vaya a saltar (Fuente: Quiz · Sesión 1)
.
Sustituir comprobaciones duras por instrucciones: Intentar que las instrucciones en AGENTS.md reemplacen a los linters, comprobadores de tipos o checks automáticos en CI/CD (Fuente: Quiz · Sesión 1)
.
(c) Cómo verificar que el resultado de un agente es correcto
Buenas prácticas:
Comprobación externa en CI/CD: Ejecutar los tests y validaciones desde un entorno de CI/CD independiente para no depender de que el agente los ejecute o reporte bien (Fuente: Quiz · Sesión 1 y Quiz · Sesión 3)
.
Capas combinadas (Queso Suizo): Integrar linters, comprobadores de tipos, tests unitarios, de integración, E2E y checks de integridad arquitectónica (Fuente: Quiz · Sesión 3)
.
Evidencia objetiva y repetible: Exigir tests que comprueben comportamientos reales y medir tiempos en condiciones comparables para dar por buenas las optimizaciones (Fuente: Quiz · Sesión 2)
.
Checks de merge obligatorios: Usar reglas de lint o tests en CI que bloqueen el merge automáticamente ante incumplimientos (Fuente: Quiz · Sesión 1)
.
Comprender la lógica del cambio: Exigir que el equipo entienda el comportamiento (ej. cuándo se invalida una caché) y lo contraste con los requisitos (Fuente: Quiz · Sesión 2)
.
Contrastar con glosario y especificaciones: Validar que la solución coincide con la intención de negocio y los términos del glosario (Fuente: Quiz · Sesión 5)
.
Errores comunes:
Aceptar por la elocuencia o explicación del agente: Dar por correcto un cambio porque el agente confirme que funciona, porque el plan sea muy detallado o la explicación resulte convincente (Fuente: Quiz · Sesión 2, Quiz · Sesión 4 y Quiz · Sesión 5)
.
Delegar la aprobación en otro agente: Aceptar el cambio solo porque un agente revisor lo haya aprobado (Fuente: Quiz · Sesión 2)
.
Aprobar por tests verdes sin entender el código: Aceptar un cambio porque los tests pasen sin comprender cómo gestiona estados o datos críticos (Fuente: Quiz · Sesión 2)
.
Confundir menos código o rapidez con calidad: Evaluar la calidad por la cantidad de código generado, las líneas eliminadas o el tiempo consumido sin verificar comportamientos (Fuente: Quiz · Sesión 2 y Quiz · Sesión 3)
.
4. Métodos, métricas o criterios para medir calidad, tiempo o coste
Métodos de evaluación
Evaluación comparativa desde fuera (Eval de arnés/skills): Repetir la misma tarea desde el mismo estado inicial en chats nuevos e independientes, midiendo de forma externa el resultado (Fuente: Quiz · Sesión 1, Quiz · Sesión 3 y Quiz · Sesión 4)
.
Comparativas de arneses con el mismo modelo: Uso de índices externos (Coding Agent Index de Artificial Analysis) para evaluar un mismo modelo (ej. Claude Opus 4.7) sobre distintos arneses (OpenCode, Cursor CLI, Claude Code) (Fuente: referencias-arneses.md)
.
Métricas de calidad del código y verificación
Tests y escenarios reproducibles: Verificación del comportamiento mediante casos de prueba unitarios, de integración y E2E (Fuente: Quiz · Sesión 2 y Quiz · Sesión 3)
.
Mutation testing: Medición de la efectividad del conjunto de tests mediante la introducción de mutaciones en el código para detectar fallos o lagunas de cobertura (Fuente: Quiz · Sesión 3)
.
Porcentaje de cobertura de tests: Se menciona como una métrica existente, pero se advierte explícitamente de que priorizar la cobertura no garantiza que los tests expliquen los fallos ni comprueben la intención real (Fuente: Quiz · Sesión 3 y Quiz · Sesión 5)
.
Linters y comprobación de tipos: Feedback rápido sobre corrección estática y tipos (Fuente: Quiz · Sesión 3)
.
Comprobaciones de accesibilidad: Análisis de la interfaz renderizada e interacciones de teclado y foco (Fuente: Quiz · Sesión 3)
.
Checks de integridad arquitectónica: Medición del cumplimiento de las reglas de dependencias entre capas (Fuente: Quiz · Sesión 3)
.
Métricas de rendimiento y eficiencia
Tiempo de ejecución medible: Medición de tiempos de respuesta en condiciones y datos idénticos para comprobar optimizaciones de rendimiento (Fuente: Quiz · Sesión 2)
.
Tiempo total consumido y coste financiero / consumo de tokens: Mapeo del tiempo y el consumo de tokens/coste por ejecución como variables de comparación en la evaluación de configuraciones de agentes (Fuente: Quiz · Sesión 3 y Quiz · Sesión 4)
.
Criterios de control en loops
Límites de reintentos y gasto: Fijación explícita de un número máximo de intentos y un tope de gasto (tokens/coste) en los loops agénticos antes de parar o escalar la tarea a una persona (Fuente: Quiz · Sesión 4)
.
Elementos que NO aparecen en las fuentes
Tasa de acierto explícita: No se proporciona ni se define una métrica con el nombre explícito de "tasa de acierto" porcentual (Fuente: Quiz · Sesión 3 y Quiz · Sesión 4)
.
Costes o tarifas por modelo: Tampoco se incluyen tablas numéricas de precios ni desglose monetario del coste por modelo o token (Fuente: Quiz · Sesión 3 y referencias-arneses.md)
.
5. Herramientas, modelos de IA y planes/precios
Herramientas y Arneses mencionados y su uso recomendado
Claude Code: Arnés/herramienta de CLI de Anthropic. Se recomienda para trabajar sobre el repositorio local, destacando que vuelve a cargar automáticamente el archivo CLAUDE.md de la raíz tras compactar el contexto (Fuente: Quiz · Sesión 1, README.md (Sesión 1) y referencias-arneses.md)
.
Codex (OpenAI): Arnés/repositorio de OpenAI. Se recomienda para ejecutar agentes sobre un entorno con herramientas de ejecución (exec_command), edición y gestión de skills (Fuente: lo-que-ve-el-agente.md, README.md (Sesión 1) y referencias-arneses.md)
.
OpenCode: Arnés de código abierto. Se menciona como alternativa de arnés para ejecutar modelos de código (Fuente: referencias-arneses.md)
.
Cursor CLI: Arnés de terminal de Cursor para la ejecución de modelos de IA (Fuente: referencias-arneses.md)
.
OpenSpec: Framework / herramienta de especificación (Software-Driven Development). Se recomienda para mantener especificaciones y paquetes de cambio dentro del repositorio (Fuente: FUENTES.md y README.md (Sesión 2))
.
Open Knowledge / Open Knowledge Format (OKF): Aplicación y especificación de formato de metadatos. Se recomienda para organizar, enlazar y consultar conocimiento estructurado sobre el proyecto (Fuente: value-add.md, FUENTES.md y README.md (Sesión 2))
.
Figma: Herramienta de diseño. Se recomienda para revisar diseños (variantes desktop y mobile), tokens y componentes antes de implementar la interfaz (Fuente: FUENTES.md y README.md (Sesión 2))
.
Modelos de IA mencionados
Claude Opus 4.7: Único modelo concreto mencionado expresamente por su nombre en el track, utilizado en la captura comparativa de Artificial Analysis para evaluar el rendimiento del mismo modelo sobre distintos arneses (Fuente: referencias-arneses.md)
.
Recomendación general sobre modelos: Se advierte de que recurrir a modelos más capaces ayuda, pero no resuelve por sí solo las dudas de supervisión ni justifica dar por válidos los cambios sin verificación (Fuente: Quiz · Sesión 2 y Quiz · Sesión 4)
.
Planes o Precios
NO se mencionan en las fuentes: En ninguna de las 25 fuentes del track se especifican planes de suscripción (ej. Pro, Team, Enterprise), precios numéricos ni tarifas comerciales de las herramientas o modelos (Fuente: todas las fuentes)
. Se trata la variable "coste" únicamente como un criterio abstracto de evaluación y límite de control en los loops

## Track transversal

1. Justificación de negocio de soluciones con IA
A continuación se detalla lo que enseñan las fuentes sobre cada aspecto de la justificación de negocio:
Cálculo de ROI:
No aparece en las fuentes: No se proporciona una fórmula o metodología formal para el cálculo numérico del ROI (retorno de inversión). Las fuentes abordan métricas de impacto empresarial general —como el estudio de McKinsey que señala que rediseñar el flujo completo decidiendo qué pieza va con regla, flujo, agente o humano es el mayor motor de impacto en EBIT
, o datos de BCG sobre crecimiento de ingresos
— e identifican los factores de coste computacional (tokens de entrada/salida y latencia)
, pero no detallan un cálculo financiero de ROI.
Coste por hora:
No aparece en las fuentes: El parámetro "coste por hora" no se trata en el temario. El consumo económico de la IA se mide en las fuentes en términos de coste por millón de tokens de entrada/salida y consumo de licencias o créditos API, no por tarifa horaria
.
Medición de productividad:
Estudio HBS sobre consultores de BCG: La productividad se mide cuantitativamente observando que los profesionales respaldados por IA completaron un 12.2% más de tareas, un 25.1% más rápido y con una mejora de calidad superior al 40% frente al grupo de control
.
Desarrollo de Software (GitHub Copilot / Cloud Code): La productividad se mide en velocidad de generación de código (Copilot genera el 46% del código promedio y eleva la velocidad hasta un +55%), estableciendo que se requiere una curva de adopción de unas 11 semanas para observar ganancias reales de productividad
.
Organizaciones "Future-built" (BCG): Las empresas que orquestan adecuadamente la colaboración humano-IA generan 1.7 veces más crecimiento de ingresos que sus competidores rezagados
.
Patrón de uso (Anthropic Economic Index): Mide el impacto observando que la "aumentación" (aumento de capacidades donde el humano dirige y valida) representa el 52% de las conversaciones frente al 45% de automatización pura
.
Comparación antes/después:
Prompt Lab / Metodología de Evaluación de Prompts: Se enseña a medir la mejora comparando directamente la ejecución de un prompt débil (versión 1) frente a uno estructurado (versión 2) sobre la misma entrada de datos, autoevaluando ambos con una rúbrica idéntica de 5 criterios sobre 50 puntos (seguimiento de tarea, completitud, precisión, formato y trazabilidad) para comparar los scores numéricos antes y después
.
Grupos de control en estudios: Comparación sistemática de desempeño entre consultores sin IA y consultores aumentados con IA
.
Separación entre datos medidos y estimaciones:
Guidelines de Calidad en Prompting: Se establece como norma obligatoria en la estructura de prompts separar explícitamente los hechos/datos confirmados de las hipótesis, inferencias, estimaciones y recomendaciones
.
Reglas anti-alucinación: Se enseña a incluir la instrucción explícita de "si un dato no está en el contexto o no ha sido medido, márcalo como pendiente de revisar en vez de inventarlo o estimarlo a ciegas"
.
Simuladores de decisión: En la creación de artefactos interactivos (calculadoras/simuladores) se parametrizan las variables reales y medidas separándolas de los supuestos o estimaciones no controladas para observar cómo cambia el resultado sin enmascarar los datos de partida
.
Filtro de Discernment (Marco 4D): Exige recordar que un texto bien redactado ("fluido") no equivale a un dato real o medido, requiriendo verificar la precisión y separar evidencia verificada de interpretaciones
.
2. Riesgos, seguridad, privacidad, confidencialidad, credenciales y uso responsable
Riesgos y Seguridad:
Auditoría de Skills: Se advierte que las skills deben utilizarse solo de fuentes confiables y auditarse igual que el software corporativo, ya que una skill maliciosa puede ejecutar acciones que difieran de su propósito declarado
.
Vulnerabilidades en Conectores (MCP): Se alerta sobre riesgos de seguridad en conectores externos, citando casos reales (como el caso Postmark) donde un MCP modificado por un atacante abrió un backdoor para enviar copias ocultas de los correos corporativos a un tercero
.
Entornos aislados y Guardarraíles en Agentes: Para evitar incidentes de seguridad o comportamientos inesperados en sistemas agénticos autónomos, es obligatorio probarlos en entornos aislados (sandboxes) y configurar guardarraíles de seguridad antes de darles capacidad de actuar sobre sistemas reales
.
Observabilidad en Producción: Exigencia de trazabilidad y monitoreo continuo (mediante plataformas como Phoenix) para auditar qué datos usó el agente, qué acciones ejecutó, su latencia y su coste
.
Privacidad y Confidencialidad de datos de cliente:
Prohibición en cuentas/interfaces públicas: Está prohibido subir datos privados de clientes a interfaces conversacionales públicas o cuentas personales comerciales (ej. ChatGPT comercial o Claude estándar), ya que la información es procesada y utilizada para reentrenar modelos de terceros
.
Infraestructuras seguras:
Azure OpenAI Service / Tenants Enterprise: En sectores regulados (farma, banca) se emplean servicios en la nube privada (ej. Azure OpenAI Service) donde los datos permanecen dentro del tenant y región de la empresa y no se utilizan para entrenar modelos de terceros
.
Despliegues Self-Hosted / On-Premise: Uso de herramientas self-hosted (como n8n Community) o modelos Open-Weight (Llama, Mistral) en servidores corporativos propios para garantizar que el dato no salga del servidor y cumplir estrictamente con la RGPD y la AI Act
.
Cuentas y licencias Enterprise: Exigencia de trabajar exclusivamente con planes y licencias corporativas o skills homologadas que garanticen por contrato el tratamiento confidencial de la información
.
Gestión de credenciales:
Punto parcial / No aparece en detalle: Las fuentes mencionan el proceso de autenticación mediante protocolos estándar (OAuth / login con usuario y contraseña) para autorizar la conexión entre asistentes y conectores MCP o herramientas externas
, así como la configuración de endpoints y claves dentro del tenant privado corporativo
. Sin embargo, no aparece en las fuentes un bloque explicativo o normativa específica sobre la "gestión de credenciales" (como el uso de gestores de secretos, bóvedas/vaults o rotación de claves API).
Uso responsable de la IA en el trabajo:
Definición de AI Fluency (Anthropic Academy): Definida como la capacidad de trabajar con sistemas de IA de forma efectiva, eficiente, ética y segura
.
Responsabilidad y Accountability: Una persona humana debe ser siempre el responsable último de cualquier decisión o entregable elaborado con IA; el sistema o agente nunca asume responsabilidad ética o legal
.
Marco 4D (Delegation, Description, Discernment, Diligence): Exige transparencia (Transparency Diligence), verificación crítica de la corrección del output (Discernment), definición precisa de expectativas (Description) y análisis del riesgo antes de delegar (Delegation)
.
Human-in-the-loop: Mantenimiento obligatorio del criterio y la supervisión humana en los puntos críticos del flujo antes de ejecutar acciones o enviar entregables a clientes
.
Profesional con criterio: El temario contrapone al simple "usuario de IA" frente al profesional con criterio, cuyo objetivo es integrar la IA en su trabajo diario con juicio, trazabilidad y responsabilidad