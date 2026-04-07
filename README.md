# SDD Legal - Spec-Driven Development Jurídico

**App web que aplica metodología de ingeniería de software a la práctica jurídica.**

Abra `index.html` en su navegador. No requiere instalar nada.

**[Descargar ZIP](SDD_LEGAL_app.zip)** -- Descargue, descomprima y abra `index.html`.

**Autor:** Juan Alejandro Herrera López - Abogado TI y programador

---

## Cómo funciona

```
Demanda (texto, PDF, DOCX o HTML)
  |
  v
[PASO 1: IA analiza] --> JSON con opciones estratégicas
  |
  v
[PASO 2: USTED elige] --> Decisión estratégica (dropdown)
  |
  v
[PASO 3: IA redacta] --> Escrito con etiquetas [CA-XX]
  |
  v
[PASO 4: Reporte QA] --> Criterios satisfechos / pendientes
  |
  v
[Descargar reporte .docx]
```

La IA **no elige la estrategia**. Le presenta opciones con ventajas y riesgos. Usted decide. Después la IA redacta siguiendo su decisión, y al final genera un reporte de QA que le permite verificar criterio por criterio.

---

## Inicio rápido

1. Obtenga una API Key gratis en [Google AI Studio](https://aistudio.google.com/apikey)
2. Abra `index.html` en su navegador (doble-click)
3. Pegue su API Key y presione **Probar conexión**
4. Siga los 4 pasos

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `index.html` | Interfaz principal |
| `app.js` | Lógica: llamadas a Gemini, parsing, reporte |
| `style.css` | Estilos (dark theme) |
| `kit.js` | Demanda ejemplo + schema JSON embebidos |
| `demanda_ejemplo.txt` | Demanda ficticia de ejemplo (texto completo) |

## Formatos de demanda soportados

- `.txt` (texto plano)
- `.html` / `.htm`
- `.pdf` (requiere conexión a internet para cargar PDF.js)
- `.docx` (requiere conexión a internet para cargar Mammoth.js)

## Advertencia de confidencialidad

Los datos se envían a Google (Gemini API). Si usa una demanda real:
- Reemplace nombres por "Parte A / Parte B"
- Elimine cédulas, cuentas y datos de contacto
- Reemplace el expediente por un código genérico

---

# El artículo: Spec-Driven Development jurídico

*Por Juan Alejandro Herrera López -- Abogado especialista en ingeniería de software*

---

Los ingenieros de software aprendieron hace décadas algo que la mayoría de los abogados todavía ignoramos: no se escribe código antes de definir con precisión qué debe hacer ese código.

En derecho hacemos exactamente lo contrario. Abrimos el expediente, leemos la demanda, y empezamos a redactar. Investigamos "por las dudas". Añadimos argumentos que surgieron a mitad de la redacción. Revisamos el escrito con la misma intuición con la que lo escribimos.

El resultado es predecible: escritos redundantes, defensas que se contradicen entre sí, argumentos sin soporte probatorio, y revisiones que son en realidad reescrituras completas.

## La tesis de este artículo

El Spec-Driven Development (SDD) -- una metodología de desarrollo de software -- ofrece un framework estructural que puede transformar cómo los abogados analizan, investigan y redactan. No es metáfora. Es ingeniería aplicada al derecho.

## ¿Qué es Spec-Driven Development?

En SDD, antes de escribir una sola línea de código, el equipo define una especificación formal del resultado esperado: qué debe producir el sistema, bajo qué condiciones es correcto, y cómo se verifica. La implementación viene después. La revisión verifica contra la spec, no contra intuición.

Trasladado al dominio jurídico, la lógica es la misma:

- Antes de redactar, se define qué debe lograr el escrito procesal.
- Antes de investigar, se define qué preguntas jurídicas necesitan respuesta.
- Antes de presentar, se verifica el escrito contra criterios predefinidos -- no contra intuición.

### El framework en seis fases

Cada fase produce un artefacto concreto y verificable:

| Fase | Objetivo | Artefacto |
|------|----------|-----------|
| 0 Intake | Capturar hechos, pretensiones, partes, plazos | Brief del caso |
| 1 Spec de resultado | Definir qué debe lograr el acto procesal | Ficha de resultado esperado |
| 2 Criterios de aceptación | Definir cómo se verifica si el escrito es correcto | Lista CA-01 a CA-N |
| 3 Investigación dirigida | Solo investigar lo que la spec requiere | Mapa normativo trazable |
| 4 Redacción con trazabilidad | Cada sección mapea a un criterio | Escrito con etiquetas [CA-XX] |
| 5 Review estructurado | Verificar el escrito contra cada criterio | Checklist de aprobación |
| 6 Cierre como activo | Archivar spec + escrito + resultado | Plantilla reutilizable |

## Caso práctico: demanda por responsabilidad objetiva contra un banco por estafa digital

En Costa Rica, las demandas contra entidades bancarias por fraudes electrónicos (phishing, SIM swapping, vishing) invocan responsabilidad objetiva al amparo del artículo 1048 del Código Civil y el artículo 35 de la Ley 7472. Son casos donde la estrategia defensiva puede ser radicalmente diferente dependiendo de un solo dato: ¿el fraude explotó una vulnerabilidad del sistema bancario, o fue ingeniería social sobre el usuario?

Sin SDD, el abogado defensor puede llegar al escrito con tres estrategias a medias -- y ninguna completamente desarrollada:

1. "El banco cumplió todos los estándares SUGEF/BCCR, por lo tanto no hay responsabilidad" -- defensa por cumplimiento normativo.
2. "El fraude fue culpa del usuario que entregó sus credenciales" -- defensa por culpa de la víctima.
3. "El banco no es el sujeto pasivo correcto porque el fraude lo ejecutó un componente externo al sistema" -- excepción de falta de legitimación pasiva.

El problema no es tener las tres líneas. Es que son parcialmente incompatibles: alegar culpa del usuario implica aceptar que el banco tenía una obligación de cuidado sobre él. Alegar falta de legitimación pasiva sostiene que el banco es ajeno al daño -- lo que cierra la puerta a las otras dos como defensa principal. Sin una Fase 1 que fuerce a elegir antes de redactar, el escrito llega con las tres a medias, debilitándose mutuamente.

### Fase 1 -- Ficha de resultado esperado

| Campo | Valor |
|-------|-------|
| Resultado mínimo | Rechazo total de la pretensión de CRC 14.200.000 o reducción por concausa del usuario |
| Resultado óptimo | Excepción de falta de legitimación pasiva: el fraude fue vishing externo sin vulneración del sistema bancario |
| Restricción crítica | El tipo de fraude determina toda la estrategia. Debe clarificarse antes de elegir defensas |

### Fase 2 -- Los 7 criterios de aceptación

| Código | Criterio | Nivel |
|--------|----------|-------|
| CA-01 | Se analizó si procede excepción de falta de legitimación pasiva según el tipo de estafa | Crítico |
| CA-02 | Se acreditó cumplimiento del Acuerdo SUGEF 15-16 o se identificaron los controles aplicables | Importante |
| CA-03 | Se verificó si la banca digital califica como actividad peligrosa según línea Sala Primera | Crítico |
| CA-04 | Se revisó normativa BCCR sobre sistemas de pago aplicable al tipo de transacción | Contexto |
| CA-05 | Se evaluó la culpa del usuario como eximente o concausa con base en los hechos | Importante |
| CA-06 | Se argumentó ruptura del nexo causal por hecho de tercero o causa extraña si procede | Defensa |
| CA-07 | Se incluyó defensa subsidiaria con fundamento en art. 1045 CC | Importante |

## QA jurídico: el control de calidad que la abogacía nunca tuvo

En ingeniería de software, Quality Assurance (QA) es el proceso sistemático de verificar que el producto cumple su especificación antes de salir al mundo. No es lo mismo que "revisión" -- es verificación estructurada contra criterios predefinidos, ejecutada por alguien distinto al autor.

En derecho, el equivalente no existe formalmente. La "revisión" de un escrito es, en la mayoría de los despachos, que el socio lo lea y le cambie algunas frases. No hay criterios. No hay trazabilidad. No hay separación entre quien implementó y quien verifica.

### Propuesta: QA jurídico en tres niveles

**Nivel 1 -- Verificación contra criterios (self-QA)**
El redactor verifica su propio escrito contra el checklist de criterios antes de entregarlo. No es releer el texto: es pasar cada CA-XX y confirmar que está satisfecho con evidencia concreta. Si un criterio falla, regresa a la fase de redacción o investigación -- no parchea sobre el texto final.

**Nivel 2 -- Revisión por criterios (peer-QA)**
Un segundo abogado revisa el escrito exclusivamente contra los criterios de aceptación. La pregunta no es "¿está bien redactado?", sino "¿cada criterio está satisfecho?". Esto permite distribuir la revisión: uno verifica los criterios procesales, otro los sustantivos.

**Nivel 3 -- Trazabilidad hacia la prueba (evidence-QA)**
El nivel más avanzado: verificar no solo que el argumento existe en el escrito, sino que hay prueba ofrecida que lo sostiene. Si CA-02 dice que el banco cumplió SUGEF 15-16, el escrito debe ofrecer el certificado de cumplimiento. Sin evidencia, el criterio no está realmente satisfecho.

## Ingeniería de contexto: la capa que convierte la spec en instrucciones para la IA

Cuando se incorpora un modelo de lenguaje al flujo de trabajo jurídico, aparece una capa adicional que la ingeniería de software ya conoce bien: la ingeniería de contexto. Es la disciplina de construir el contexto que recibe un LLM de forma sistemática y deliberada, de modo que su output sea predecible, verificable y alineado con la spec. No es "escribir buenos prompts". Es diseñar la información que el modelo necesita para comportarse como un colaborador jurídico, no como un generador de texto genérico.

### Por qué importa en derecho

Un LLM sin contexto estructurado produce respuestas plausibles. Un LLM con ingeniería de contexto produce respuestas trazables. La diferencia, en el dominio jurídico, es la diferencia entre una herramienta útil y una que inventa jurisprudencia con total convicción.

### Los cuatro componentes del contexto jurídico

| Componente | Contenido en el dominio jurídico |
|------------|----------------------------------|
| System prompt | Rol del modelo, restricciones de comportamiento y formato de respuesta esperado |
| Spec como contexto | La ficha de resultado esperado y los criterios se inyectan directamente. El LLM no supone el objetivo -- lo recibe explícitamente |
| Few-shot jurídico | Pares input/output que muestran al modelo cómo razonar: un hecho procesal -> el argumento correcto con la estructura del despacho |
| Restricciones de output | Qué NO debe hacer el modelo: no proponer defensas incompatibles entre sí, no citar normas fuera del mapa normativo sin señalarlo |

## La prueba real: qué pasa cuando no se usa el framework

Para demostrar el valor del framework, se ejecutó el mismo caso -- la demanda ficticia de estafa digital -- con dos enfoques distintos usando Gemini Flash.

**Prueba 1 -- Sin Prompt 2 estructurado:** Se entregó al modelo la demanda y el JSON sin las instrucciones de restricción. El modelo tomó la decisión estratégica por su cuenta, eligió "culpa exclusiva de la víctima" como defensa principal, e ignoró que esa decisión correspondía al abogado.

**Prueba 2 -- Con Prompt 2 completo:** Se entregó el JSON con decision_estrategica completada por el abogado y las instrucciones de restricción explícitas. El modelo ejecutó dentro de la spec, generó el reporte de QA al final, y señaló los criterios que no pudo satisfacer.

### Análisis comparativo

| Aspecto | Sin Prompt 2 | Con Prompt 2 |
|---------|-------------|-------------|
| Decisión estratégica | La tomó el modelo sin consultar | Respetó la decision_estrategica del abogado |
| Estrategias incompatibles | Alegó falta de legitimación y culpa del usuario simultáneamente | Una sola defensa principal; subsidiaria claramente separada |
| Etiquetas CA-XX | Algunas mal ubicadas | Correctamente al inicio de cada párrafo de fondo |
| Criterios no cubiertos | No señalados -- el texto parece completo | Declarados explícitamente al final del escrito |
| Reporte de QA | Ausente | Presente: criterios satisfechos, pendientes y alertas |
| Jurisprudencia Sala Primera | No citada ni señalada como pendiente | Marcada como [SUGERENCIA -- verificar] sin usarla como fundamento |

La conclusión del experimento es precisa: ambos escritos son fluidos y profesionales a primera lectura. Los problemas del primer output solo se detectan si el abogado sabe qué buscar. El segundo hace ese trabajo automáticamente -- el reporte de QA convierte la revisión de una lectura subjetiva en una verificación objetiva contra criterios predefinidos.

## Del humano en el loop a los agentes: la evolución natural del framework

El framework descrito hasta aquí tiene al abogado como actor central en cada fase. Pero la misma arquitectura que hace al proceso verificable con un humano lo hace ejecutable con agentes de IA -- porque la spec es el contrato que todos los participantes, humanos o artificiales, deben cumplir.

Un agente de IA es un modelo de lenguaje que puede ejecutar acciones, llamar herramientas y encadenar pasos de forma autónoma. Lo que transforma un prompt en un agente es que puede actuar, no solo responder. Y lo que hace que un agente jurídico sea confiable es exactamente lo que hace que un escrito jurídico sea confiable: una especificación formal de qué debe producir, bajo qué condiciones es correcto, y quién verifica.

### Arquitectura: orquestador con tres agentes especializados

```
Demanda
  |
  v
[Agente Analizador] -> JSON con opciones estratégicas
  |
  v
** ABOGADO elige estrategia **
  |
  v
[Agente Redactor] -> Escrito con etiquetas [CA-XX]
  |
  v
[Agente QA] -> Reporte: aprobado / no aprobado
  |
  v
** ABOGADO: revisión final **
```

Los puntos marcados con ** son compuertas humanas. El sistema no avanza sin aprobación del abogado.

**El orquestador** es el director del proceso. No redacta ni analiza -- coordina. Recibe la demanda, inicializa el JSON de spec, delega al agente correspondiente según la fase, y gestiona los dos puntos de aprobación humana obligatorios.

**Agente 1 -- Analizador:** Recibe la demanda y el schema JSON vacío. Analiza la demanda, completa los campos objetivos, genera las opciones estratégicas con sus riesgos, y propone los criterios de aceptación. Devuelve el JSON parcialmente completado con decision_estrategica en null.

**Punto de aprobación humana 1 -- OBLIGATORIO:** El abogado recibe el JSON, revisa las opciones, elige la defensa principal, y completa decision_estrategica. Sin esta aprobación, el sistema no avanza.

**Agente 2 -- Redactor:** Recibe el JSON aprobado. Redacta el escrito siguiendo la spec de forma estricta, con etiquetas [CA-XX] en cada párrafo de fondo, señalando criterios no satisfacibles en lugar de inventar argumentos.

**Agente 3 -- QA:** Recibe el escrito y el JSON de spec. Verifica sistemáticamente que cada criterio tiene un párrafo correspondiente, que ninguna restricción fue violada, que cada criterio con prueba_requerida tiene prueba ofrecida, y que la estrategia principal no fue contaminada por opciones descartadas.

**Punto de aprobación humana 2 -- OBLIGATORIO:** El abogado recibe el escrito y el reporte QA. El escrito nunca sale sin autorización humana explícita.

### El JSON como estado compartido entre agentes

| Campo del JSON | Quién lo escribe | Quién lo lee |
|----------------|-----------------|-------------|
| caso, partes | Agente Analizador | Agente Redactor, Agente QA |
| decision_estrategica | El abogado -- punto 1 | Agente Redactor, Agente QA |
| satisfecho (por criterio) | Agente QA | El abogado -- punto 2 |
| aprobado_para_presentacion | El abogado -- punto 2 | Orquestador (condición de salida) |
| cierre | El abogado -- post-resolución | Base de conocimiento / RAG |

## Por qué esto importa más allá del litigio

El SDD jurídico no es solo útil para contestar demandas. El mismo principio aplica a dictámenes e informes jurídicos, contratos y auditorías. Y tiene una dimensión que los abogados que trabajamos con IA deberíamos tomar muy en serio: cuando se usa un modelo de lenguaje para investigar o redactar, la spec y los criterios de aceptación son exactamente lo que se necesita para verificar el output. Un LLM puede producir un escrito fluido con jurisprudencia inventada. El QA jurídico es la capa que lo detecta. La ingeniería de contexto es la capa que lo previene. Los agentes son la capa que lo escala.

## Conclusión

Los ingenieros de software tardaron décadas en aceptar que escribir código sin especificación es más caro, no más rápido. En derecho estamos en ese mismo punto de inflexión.

El SDD jurídico no propone más burocracia. Propone que el tiempo invertido en definir el resultado esperado antes de redactar se recupera con creces en menos reescrituras, revisiones más rápidas, y escritos trazables y auditables.

En un contexto donde la IA empieza a participar en la producción jurídica -- y donde los agentes empiezan a ejecutar partes del proceso de forma autónoma -- tener una especificación formal no es opcional. Es la única forma de verificar que lo que salió es lo que se necesitaba. Y es la única forma de que la IA trabaje dentro de la estrategia, no a pesar de ella.

---

## Licencia

Apache License 2.0 -- ver archivo [LICENSE](LICENSE).
