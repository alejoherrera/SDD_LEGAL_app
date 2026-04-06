// Kit files embedded as JS variables -- edit here to change examples
// Generated from kit/1_demanda_ejemplo.txt and kit/2_schema_sdd.json

const DEMANDA_EJEMPLO = `REPUBLICA DE COSTA RICA
PODER JUDICIAL
JUZGADO CIVIL DE MAYOR CUANTIA -- SAN JOSE
EXPEDIENTE N. 2026-00312-0419-CI

========================================================
DEMANDA ORDINARIA DE MAYOR CUANTIA
========================================================

DEMANDANTE:
  Maria Fernanda Ulate Brenes
  Cedula: 1-0892-0341
  Vecina de San Jose, Barrio Escalante

DEMANDADO:
  Banco Nacional Ficticio S.A.
  Cedula juridica: 3-010-XXXXXX
  Representado por su apoderado generalisimo

--------------------------------------------------------
PRETENSION PRINCIPAL
--------------------------------------------------------

Que se condene al demandado al pago de CRC 14.200.000 (catorce millones
doscientos mil colones exactos) por concepto de danos y perjuicios
derivados de estafa digital sufrida el dia 8 de enero de 2026, mas
intereses legales desde la fecha del evento hasta su efectivo pago,
y las costas del proceso.

--------------------------------------------------------
HECHOS
--------------------------------------------------------

1. La senora Ulate Brenes mantiene una relacion comercial con el Banco
   Nacional Ficticio S.A. desde hace doce anos, siendo titular de la
   cuenta corriente n. XXXX-XXXX-XXXX.

2. El 8 de enero de 2026, a las 14:23 horas, la actora recibio una
   llamada telefonica al numero registrado en el banco. El llamante
   se identifico como funcionario del Departamento de Seguridad de la
   entidad, con nombre "Carlos Vargas", e indico que la cuenta habia
   sido comprometida por un acceso no autorizado.

3. El llamante instruyo a la actora a confirmar su token de seguridad
   de seis digitos y su clave de acceso al sistema de banca en linea,
   argumentando que era necesario para "congelar" la cuenta y evitar
   mayores danos.

4. La actora, confiando en la identidad del llamante y en la urgencia
   descrita, proporciono las credenciales solicitadas.

5. Entre las 14:31 y las 14:38 horas del mismo dia, se realizaron tres
   transferencias electronicas no autorizadas desde la cuenta de la
   actora hacia cuentas de terceros desconocidos, por los siguientes
   montos:
     -- Transferencia 1: CRC 5.800.000
     -- Transferencia 2: CRC 4.900.000
     -- Transferencia 3: CRC 3.500.000
     TOTAL: CRC 14.200.000

6. El banco no activo ninguna alerta por transacciones inusuales,
   a pesar de que: (a) las tres transferencias superaban el promedio
   mensual de movimientos de la cuenta; (b) los destinatarios eran
   cuentas nunca antes utilizadas por la actora; y (c) las tres
   operaciones se realizaron en un intervalo de siete minutos.

7. La actora reporto el fraude al banco a las 14:53 horas del mismo
   dia, es decir, dentro de los 15 minutos siguientes a la ultima
   transferencia. El banco informo que las transacciones no podian
   revertirse.

8. La actora presento denuncia ante el Organismo de Investigacion
   Judicial (OIJ) el 9 de enero de 2026. La investigacion se encuentra
   en curso.

--------------------------------------------------------
FUNDAMENTO JURIDICO
--------------------------------------------------------

-- Articulo 1048 del Codigo Civil: responsabilidad objetiva por
  actividad peligrosa. La banca digital constituye una actividad
  generadora de riesgo que impone al operador el deber de responder
  por los danos causados, con independencia de culpa.

-- Articulo 1045 del Codigo Civil: responsabilidad por culpa. En
  forma subsidiaria, el banco incurrio en negligencia al no implementar
  sistemas de monitoreo transaccional suficientes.

-- Articulo 35 de la Ley 7472 (Ley de Promocion de la Competencia y
  Defensa Efectiva del Consumidor): responsabilidad del proveedor de
  servicios por danos causados al consumidor.

-- Acuerdo SUGEF 15-16 (Reglamento sobre Gestion del Riesgo Operativo
  y Tecnologico): el banco tenia la obligacion de implementar controles
  de monitoreo de transacciones inusuales y autenticacion reforzada.

-- Reglamento del Sistema de Pagos del BCCR: obligaciones de seguridad
  en transferencias electronicas.

--------------------------------------------------------
PRUEBA OFRECIDA
--------------------------------------------------------

Documental:
  -- Estado de cuenta del periodo enero 2026.
  -- Registro de llamadas del telefono de la actora (8 de enero 2026).
  -- Capturas de pantalla de las notificaciones de las transferencias.
  -- Copia de la denuncia ante el OIJ.
  -- Correo electronico de respuesta del banco rechazando la reversion.

Pericial:
  -- Analisis forense de los registros de acceso y autenticacion
    del sistema bancario el dia del evento.
  -- Peritaje sobre el perfil transaccional historico de la cuenta.

Testimonial:
  -- Declaracion de la actora.

--------------------------------------------------------

San Jose, 15 de marzo de 2026.

Lic. Roberto Fallas Mendez
Abogado -- Colegio de Abogados y Abogadas de Costa Rica N. XXXXX
Tel: XXXX-XXXX | rfallas@ejemplo.cr

========================================================
NOTA: Este documento es completamente ficticio.
Todos los datos son inventados con fines ilustrativos.
No representa a ninguna persona o entidad real.
========================================================`;

const SCHEMA_SDD = {
  "$schema": "legal-spec/v1.0",
  "$instrucciones": "Complete este schema con la informacion de la demanda. Los campos con valor descriptivo entre comillas son los que el modelo debe llenar. Los campos 'false' y 'null' al final NO los modifiques -- los completa el abogado durante la revision.",

  "spec_id": "SPEC-{YYYY-NNNN}",

  "caso": {
    "tipo": "string -- ej: contestacion_demanda, recurso_apelacion, dictamen",
    "materia": "string -- ej: responsabilidad_civil_objetiva_bancaria",
    "expediente": "string | null -- numero de expediente judicial",
    "fecha_ingreso": "YYYY-MM-DD -- fecha en que se recibio la demanda",
    "plazo_procesal_dias": 0,
    "jurisdiccion": "string -- juzgado o tribunal competente"
  },

  "partes": {
    "cliente": {
      "nombre": "string -- nombre completo o razon social",
      "rol_procesal": "string -- demandado | demandante | tercero"
    },
    "contraparte": {
      "nombre": "string",
      "rol_procesal": "string"
    },
    "terceros": []
  },

  "resultado_esperado": {
    "$nota": "Presenta 2-3 opciones estrategicas con sus ventajas y riesgos. No elijas -- eso lo hace el abogado.",
    "opciones": [
      {
        "descripcion": "string -- que se busca lograr con esta estrategia",
        "ventaja": "string -- por que esta defensa es solida",
        "riesgo": "string -- que hecho o norma la debilita",
        "requiere_investigacion_previa": "string | null"
      }
    ],
    "restricciones_criticas": [
      "string -- hechos o condiciones que limitan las opciones estrategicas"
    ],
    "decision_estrategica": null
  },

  "criterios_aceptacion": [
    {
      "$nota": "Genera entre 5 y 8 criterios. Cada uno debe ser falseable: se puede marcar verdadero o falso al revisar el escrito.",
      "codigo": "CA-01",
      "descripcion": "string -- condicion concreta y verificable en el escrito final",
      "nivel": "Critico | Importante | Defensa | Contexto",
      "norma_base": ["string -- articulo y ley aplicable"],
      "prueba_requerida": "string | null -- evidencia que debe ofrecerse para sostener este argumento",
      "satisfecho": false,
      "referencia_parrafo": null
    }
  ],

  "mapa_normativo": [
    {
      "fuente": "string -- ley, reglamento o jurisprudencia",
      "referencia": "string -- articulo especifico o numero de voto",
      "criterios_que_satisface": ["CA-NN"],
      "resumen": "string -- que establece esta norma en el contexto del caso",
      "favorece_a": "cliente | contraparte | neutral"
    }
  ],

  "context_engineering": {
    "$nota": "Complete estos campos pensando en como le darias instrucciones a otro modelo de IA para redactar el escrito.",
    "system_prompt_base": "string -- rol e instrucciones generales para el LLM redactor",
    "restricciones_llm": [
      "string -- que NO debe hacer el modelo al redactar"
    ],
    "formato_salida_esperado": "string -- estructura esperada del escrito con etiquetas [CA-XX]"
  },

  "qa": {
    "self_qa_completado": false,
    "peer_qa_completado": false,
    "evidence_qa_completado": false,
    "criterios_fallidos": [],
    "aprobado_para_presentacion": false
  },

  "cierre": {
    "resultado_real": null,
    "desviaciones_de_spec": [],
    "leccion_aprendida": null,
    "reutilizable_como_plantilla": false
  }
};
