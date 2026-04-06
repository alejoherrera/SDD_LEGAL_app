# SDD Legal - Spec-Driven Development Juridico

**App web que aplica metodologia de ingenieria de software a la practica juridica.**

Abra `index.html` en su navegador. No requiere instalar nada.

**Autor:** Juan Alejandro Herrera Lopez - Abogado TI y programador

---

## Como funciona

```
Demanda (texto, PDF, DOCX o HTML)
  |
  v
[PASO 1: IA analiza] --> JSON con opciones estrategicas
  |
  v
[PASO 2: USTED elige] --> Decision estrategica (dropdown)
  |
  v
[PASO 3: IA redacta] --> Escrito con etiquetas [CA-XX]
  |
  v
[PASO 4: Reporte QA] --> Criterios satisfechos / pendientes
  |
  v
[Descargar reporte .txt]
```

La IA **no elige la estrategia**. Le presenta opciones con ventajas y riesgos. Usted decide. Despues la IA redacta siguiendo su decision, y al final genera un reporte de QA que le permite verificar criterio por criterio.

---

## Inicio rapido

1. Obtenga una API Key gratis en [Google AI Studio](https://aistudio.google.com/apikey)
2. Abra `index.html` en su navegador (doble-click)
3. Pegue su API Key y presione **Probar conexion**
4. Siga los 4 pasos

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `index.html` | Interfaz principal |
| `app.js` | Logica: llamadas a Gemini, parsing, reporte |
| `style.css` | Estilos (dark theme) |
| `kit.js` | Demanda ejemplo + schema JSON embebidos |

## Formatos de demanda soportados

- `.txt` (texto plano)
- `.html` / `.htm`
- `.pdf` (requiere conexion a internet para cargar PDF.js)
- `.docx` (requiere conexion a internet para cargar Mammoth.js)

## Advertencia de confidencialidad

Los datos se envian a Google (Gemini API). Si usa una demanda real:
- Reemplace nombres por "Parte A / Parte B"
- Elimine cedulas, cuentas y datos de contacto
- Reemplace el expediente por un codigo generico

---

# El articulo: Spec-Driven Development juridico

*Por Juan Alejandro Herrera Lopez -- Abogado TI -- Contraloria General de la Republica*

---

Los ingenieros de software aprendieron hace decadas algo que la mayoria de los abogados todavia ignoramos: no se escribe codigo antes de definir con precision que debe hacer ese codigo.

En derecho hacemos exactamente lo contrario. Abrimos el expediente, leemos la demanda, y empezamos a redactar. Investigamos "por las dudas". Anadimos argumentos que surgieron a mitad de la redaccion. Revisamos el escrito con la misma intuicion con la que lo escribimos.

El resultado es predecible: escritos redundantes, defensas que se contradicen entre si, argumentos sin soporte probatorio, y revisiones que son en realidad reescrituras completas.

## La tesis de este articulo

El Spec-Driven Development (SDD) -- una metodologia de desarrollo de software -- ofrece un framework estructural que puede transformar como los abogados analizan, investigan y redactan. No es metafora. Es ingenieria aplicada al derecho.

## Que es Spec-Driven Development?

En SDD, antes de escribir una sola linea de codigo, el equipo define una especificacion formal del resultado esperado: que debe producir el sistema, bajo que condiciones es correcto, y como se verifica. La implementacion viene despues. La revision verifica contra la spec, no contra intuicion.

Trasladado al dominio juridico, la logica es la misma:

- Antes de redactar, se define que debe lograr el escrito procesal.
- Antes de investigar, se define que preguntas juridicas necesitan respuesta.
- Antes de presentar, se verifica el escrito contra criterios predefinidos -- no contra intuicion.

### El framework en seis fases

Cada fase produce un artefacto concreto y verificable:

| Fase | Objetivo | Artefacto |
|------|----------|-----------|
| 0 Intake | Capturar hechos, pretensiones, partes, plazos | Brief del caso |
| 1 Spec de resultado | Definir que debe lograr el acto procesal | Ficha de resultado esperado |
| 2 Criterios de aceptacion | Definir como se verifica si el escrito es correcto | Lista CA-01 a CA-N |
| 3 Investigacion dirigida | Solo investigar lo que la spec requiere | Mapa normativo trazable |
| 4 Redaccion con trazabilidad | Cada seccion mapea a un criterio | Escrito con etiquetas [CA-XX] |
| 5 Review estructurado | Verificar el escrito contra cada criterio | Checklist de aprobacion |
| 6 Cierre como activo | Archivar spec + escrito + resultado | Plantilla reutilizable |

## Caso practico: demanda por responsabilidad objetiva contra un banco por estafa digital

En Costa Rica, las demandas contra entidades bancarias por fraudes electronicos (phishing, SIM swapping, vishing) invocan responsabilidad objetiva al amparo del articulo 1048 del Codigo Civil y el articulo 35 de la Ley 7472. Son casos donde la estrategia defensiva puede ser radicalmente diferente dependiendo de un solo dato: el fraude exploto una vulnerabilidad del sistema bancario, o fue ingenieria social sobre el usuario?

Sin SDD, el abogado defensor puede llegar al escrito con tres estrategias a medias -- y ninguna completamente desarrollada:

1. "El banco cumplio todos los estandares SUGEF/BCCR, por lo tanto no hay responsabilidad" -- defensa por cumplimiento normativo.
2. "El fraude fue culpa del usuario que entrego sus credenciales" -- defensa por culpa de la victima.
3. "El banco no es el sujeto pasivo correcto porque el fraude lo ejecuto un componente externo al sistema" -- excepcion de falta de legitimacion pasiva.

El problema no es tener las tres lineas. Es que son parcialmente incompatibles: alegar culpa del usuario implica aceptar que el banco tenia una obligacion de cuidado sobre el. Alegar falta de legitimacion pasiva sostiene que el banco es ajeno al dano -- lo que cierra la puerta a las otras dos como defensa principal. Sin una Fase 1 que fuerce a elegir antes de redactar, el escrito llega con las tres a medias, debilitandose mutuamente.

### Fase 1 -- Ficha de resultado esperado

| Campo | Valor |
|-------|-------|
| Resultado minimo | Rechazo total de la pretension de CRC 14.200.000 o reduccion por concausa del usuario |
| Resultado optimo | Excepcion de falta de legitimacion pasiva: el fraude fue vishing externo sin vulneracion del sistema bancario |
| Restriccion critica | El tipo de fraude determina toda la estrategia. Debe clarificarse antes de elegir defensas |

### Fase 2 -- Los 7 criterios de aceptacion

| Codigo | Criterio | Nivel |
|--------|----------|-------|
| CA-01 | Se analizo si procede excepcion de falta de legitimacion pasiva segun el tipo de estafa | Critico |
| CA-02 | Se acredito cumplimiento del Acuerdo SUGEF 15-16 o se identificaron los controles aplicables | Importante |
| CA-03 | Se verifico si la banca digital califica como actividad peligrosa segun linea Sala Primera | Critico |
| CA-04 | Se reviso normativa BCCR sobre sistemas de pago aplicable al tipo de transaccion | Contexto |
| CA-05 | Se evaluo la culpa del usuario como eximente o concausa con base en los hechos | Importante |
| CA-06 | Se argumento ruptura del nexo causal por hecho de tercero o causa extrana si procede | Defensa |
| CA-07 | Se incluyo defensa subsidiaria con fundamento en art. 1045 CC | Importante |

## QA juridico: el control de calidad que la abogacia nunca tuvo

En ingenieria de software, Quality Assurance (QA) es el proceso sistematico de verificar que el producto cumple su especificacion antes de salir al mundo. No es lo mismo que "revision" -- es verificacion estructurada contra criterios predefinidos, ejecutada por alguien distinto al autor.

En derecho, el equivalente no existe formalmente. La "revision" de un escrito es, en la mayoria de los despachos, que el socio lo lea y le cambie algunas frases. No hay criterios. No hay trazabilidad. No hay separacion entre quien implemento y quien verifica.

### Propuesta: QA juridico en tres niveles

**Nivel 1 -- Verificacion contra criterios (self-QA)**
El redactor verifica su propio escrito contra el checklist de criterios antes de entregarlo. No es releer el texto: es pasar cada CA-XX y confirmar que esta satisfecho con evidencia concreta. Si un criterio falla, regresa a la fase de redaccion o investigacion -- no parchea sobre el texto final.

**Nivel 2 -- Revision por criterios (peer-QA)**
Un segundo abogado revisa el escrito exclusivamente contra los criterios de aceptacion. La pregunta no es "esta bien redactado?", sino "cada criterio esta satisfecho?". Esto permite distribuir la revision: uno verifica los criterios procesales, otro los sustantivos.

**Nivel 3 -- Trazabilidad hacia la prueba (evidence-QA)**
El nivel mas avanzado: verificar no solo que el argumento existe en el escrito, sino que hay prueba ofrecida que lo sostiene. Si CA-02 dice que el banco cumplio SUGEF 15-16, el escrito debe ofrecer el certificado de cumplimiento. Sin evidencia, el criterio no esta realmente satisfecho.

## Ingenieria de contexto: la capa que convierte la spec en instrucciones para la IA

Cuando se incorpora un modelo de lenguaje al flujo de trabajo juridico, aparece una capa adicional que la ingenieria de software ya conoce bien: la ingenieria de contexto. Es la disciplina de construir el contexto que recibe un LLM de forma sistematica y deliberada, de modo que su output sea predecible, verificable y alineado con la spec. No es "escribir buenos prompts". Es disenar la informacion que el modelo necesita para comportarse como un colaborador juridico, no como un generador de texto generico.

### Por que importa en derecho

Un LLM sin contexto estructurado produce respuestas plausibles. Un LLM con ingenieria de contexto produce respuestas trazables. La diferencia, en el dominio juridico, es la diferencia entre una herramienta util y una que inventa jurisprudencia con total conviccion.

### Los cuatro componentes del contexto juridico

| Componente | Contenido en el dominio juridico |
|------------|----------------------------------|
| System prompt | Rol del modelo, restricciones de comportamiento y formato de respuesta esperado |
| Spec como contexto | La ficha de resultado esperado y los criterios se inyectan directamente. El LLM no supone el objetivo -- lo recibe explicitamente |
| Few-shot juridico | Pares input/output que muestran al modelo como razonar: un hecho procesal -> el argumento correcto con la estructura del despacho |
| Restricciones de output | Que NO debe hacer el modelo: no proponer defensas incompatibles entre si, no citar normas fuera del mapa normativo sin senalarlo |

## La prueba real: que pasa cuando no se usa el framework

Para demostrar el valor del framework, se ejecuto el mismo caso -- la demanda ficticia de estafa digital -- con dos enfoques distintos usando Gemini Flash.

**Prueba 1 -- Sin Prompt 2 estructurado:** Se entrego al modelo la demanda y el JSON sin las instrucciones de restriccion. El modelo tomo la decision estrategica por su cuenta, eligio "culpa exclusiva de la victima" como defensa principal, e ignoro que esa decision correspondia al abogado.

**Prueba 2 -- Con Prompt 2 completo:** Se entrego el JSON con decision_estrategica completada por el abogado y las instrucciones de restriccion explicitas. El modelo ejecuto dentro de la spec, genero el reporte de QA al final, y senalo los criterios que no pudo satisfacer.

### Analisis comparativo

| Aspecto | Sin Prompt 2 | Con Prompt 2 |
|---------|-------------|-------------|
| Decision estrategica | La tomo el modelo sin consultar | Respeto la decision_estrategica del abogado |
| Estrategias incompatibles | Alego falta de legitimacion y culpa del usuario simultaneamente | Una sola defensa principal; subsidiaria claramente separada |
| Etiquetas CA-XX | Algunas mal ubicadas | Correctamente al inicio de cada parrafo de fondo |
| Criterios no cubiertos | No senalados -- el texto parece completo | Declarados explicitamente al final del escrito |
| Reporte de QA | Ausente | Presente: criterios satisfechos, pendientes y alertas |
| Jurisprudencia Sala Primera | No citada ni senalada como pendiente | Marcada como [SUGERENCIA -- verificar] sin usarla como fundamento |

La conclusion del experimento es precisa: ambos escritos son fluidos y profesionales a primera lectura. Los problemas del primer output solo se detectan si el abogado sabe que buscar. El segundo hace ese trabajo automaticamente -- el reporte de QA convierte la revision de una lectura subjetiva en una verificacion objetiva contra criterios predefinidos.

## Del humano en el loop a los agentes: la evolucion natural del framework

El framework descrito hasta aqui tiene al abogado como actor central en cada fase. Pero la misma arquitectura que hace al proceso verificable con un humano lo hace ejecutable con agentes de IA -- porque la spec es el contrato que todos los participantes, humanos o artificiales, deben cumplir.

Un agente de IA es un modelo de lenguaje que puede ejecutar acciones, llamar herramientas y encadenar pasos de forma autonoma. Lo que transforma un prompt en un agente es que puede actuar, no solo responder. Y lo que hace que un agente juridico sea confiable es exactamente lo que hace que un escrito juridico sea confiable: una especificacion formal de que debe producir, bajo que condiciones es correcto, y quien verifica.

### Arquitectura: orquestador con tres agentes especializados

```
Demanda
  |
  v
[Agente Analizador] -> JSON con opciones estrategicas
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
** ABOGADO: revision final **
```

Los puntos marcados con ** son compuertas humanas. El sistema no avanza sin aprobacion del abogado.

**El orquestador** es el director del proceso. No redacta ni analiza -- coordina. Recibe la demanda, inicializa el JSON de spec, delega al agente correspondiente segun la fase, y gestiona los dos puntos de aprobacion humana obligatorios.

**Agente 1 -- Analizador:** Recibe la demanda y el schema JSON vacio. Analiza la demanda, completa los campos objetivos, genera las opciones estrategicas con sus riesgos, y propone los criterios de aceptacion. Devuelve el JSON parcialmente completado con decision_estrategica en null.

**Punto de aprobacion humana 1 -- OBLIGATORIO:** El abogado recibe el JSON, revisa las opciones, elige la defensa principal, y completa decision_estrategica. Sin esta aprobacion, el sistema no avanza.

**Agente 2 -- Redactor:** Recibe el JSON aprobado. Redacta el escrito siguiendo la spec de forma estricta, con etiquetas [CA-XX] en cada parrafo de fondo, senalando criterios no satisfacibles en lugar de inventar argumentos.

**Agente 3 -- QA:** Recibe el escrito y el JSON de spec. Verifica sistematicamente que cada criterio tiene un parrafo correspondiente, que ninguna restriccion fue violada, que cada criterio con prueba_requerida tiene prueba ofrecida, y que la estrategia principal no fue contaminada por opciones descartadas.

**Punto de aprobacion humana 2 -- OBLIGATORIO:** El abogado recibe el escrito y el reporte QA. El escrito nunca sale sin autorizacion humana explicita.

### El JSON como estado compartido entre agentes

| Campo del JSON | Quien lo escribe | Quien lo lee |
|----------------|-----------------|-------------|
| caso, partes | Agente Analizador | Agente Redactor, Agente QA |
| decision_estrategica | El abogado -- punto 1 | Agente Redactor, Agente QA |
| satisfecho (por criterio) | Agente QA | El abogado -- punto 2 |
| aprobado_para_presentacion | El abogado -- punto 2 | Orquestador (condicion de salida) |
| cierre | El abogado -- post-resolucion | Base de conocimiento / RAG |

## Por que esto importa mas alla del litigio

El SDD juridico no es solo util para contestar demandas. El mismo principio aplica a dictamenes e informes juridicos, contratos y auditorias. Y tiene una dimension que los abogados que trabajamos con IA deberiamos tomar muy en serio: cuando se usa un modelo de lenguaje para investigar o redactar, la spec y los criterios de aceptacion son exactamente lo que se necesita para verificar el output. Un LLM puede producir un escrito fluido con jurisprudencia inventada. El QA juridico es la capa que lo detecta. La ingenieria de contexto es la capa que lo previene. Los agentes son la capa que lo escala.

## Conclusion

Los ingenieros de software tardaron decadas en aceptar que escribir codigo sin especificacion es mas caro, no mas rapido. En derecho estamos en ese mismo punto de inflexion.

El SDD juridico no propone mas burocracia. Propone que el tiempo invertido en definir el resultado esperado antes de redactar se recupera con creces en menos reescrituras, revisiones mas rapidas, y escritos trazables y auditables.

En un contexto donde la IA empieza a participar en la produccion juridica -- y donde los agentes empiezan a ejecutar partes del proceso de forma autonoma -- tener una especificacion formal no es opcional. Es la unica forma de verificar que lo que salio es lo que se necesitaba. Y es la unica forma de que la IA trabaje dentro de la estrategia, no a pesar de ella.

---

## Licencia

MIT
