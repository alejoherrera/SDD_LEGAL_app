/* SDD Legal - Browser app (vanilla JS, no dependencies) */

// ---------------------------------------------------------------------------
// Prompts (identical to Python version prompts.py ANALYSIS["es"] / DRAFT["es"])
// ---------------------------------------------------------------------------
const PROMPT_ANALYSIS = `ROL Y TAREA
Sos un asistente juridico experto en derecho civil y procesal
costarricense. Tu tarea es analizar la demanda que te voy a
proporcionar y completar un schema JSON de especificacion juridica
(legal-spec) que funciona como plan de trabajo estructurado para
contestar la demanda.

INSTRUCCIONES -- SEGUILAS EN ORDEN

1. Lee la demanda completa antes de tocar el JSON.
   Identifica: partes, pretension, hechos clave, normas citadas,
   y cualquier dato que condicione o limite la estrategia defensiva.

2. Completa los campos objetivos -- los que puedes inferir
   directamente del texto sin necesidad de decision estrategica:
   caso, partes, mapa_normativo.

   En mapa_normativo, para cada norma indica si favorece al
   cliente (demandado), a la contraparte (demandante) o es neutral.
   Senala explicitamente las normas que debilitan la posicion
   del demandado -- el abogado necesita saberlo antes de elegir
   estrategia.

3. Para resultado_esperado: NO elijas la estrategia.
   Presenta entre 2 y 3 opciones posibles, cada una con:
   -- que se busca lograr
   -- por que es solida
   -- que hecho concreto de la demanda la debilita
   -- que investigacion previa requiere antes de poder usarla
   Deja el campo "decision_estrategica" en null.
   Esa decision la toma el abogado, no vos.

4. Para criterios_aceptacion: genera entre 5 y 8 criterios
   verificables, ordenados de mayor a menor criticidad.
   Cada criterio debe ser falseable: al revisar el escrito
   terminado debe poder marcarse como verdadero o falso sin
   ambiguedad. Evita criterios vagos como "el escrito es solido".
   Preferi criterios concretos.
   Deja satisfecho: false en todos.

5. Para mapa_normativo: lista todas las normas que aparecen
   en la demanda. Para cada una indica a que criterio contribuye
   y si favorece al cliente o a la contraparte.

6. Para context_engineering: redacta el system_prompt_base
   y las restricciones_llm que usarias si le delegaras la
   redaccion del escrito a otro modelo de IA.
   Las restricciones deben ser especificas al caso -- no genericas.
   Identifica que combinaciones de argumentos son incompatibles
   entre si y prohibilas explicitamente.

7. No modifiques los campos de qa ni cierre.
   Deja aprobado_para_presentacion: false.

8. Si un dato no aparece en la demanda, usa null.
   No inventes hechos, fechas, normas ni jurisprudencia.
   Si sugieres un fallo relevante, marcalo:
   "[SUGERENCIA -- verificar]: Sala Primera, voto X-XXXX"

9. Responde unicamente con el JSON completo y valido.
   Sin explicaciones. Sin bloques markdown.

DEMANDA:
{demand}

SCHEMA JSON:
{schema}`;

const PROMPT_DRAFT = `ROL Y TAREA
Sos un abogado redactor experto en derecho civil y procesal
costarricense. Tenes ante vos una especificacion juridica
(legal-spec) en formato JSON, validada y aprobada por el abogado
responsable del caso. Tu tarea es redactar el escrito de
contestacion de demanda siguiendo esa spec de forma estricta.

El JSON es vinculante. No lo interpretes libremente -- ejecutalo.

INSTRUCCIONES

1. Lee el JSON completo. Identifica:
   -- La decision_estrategica elegida por el abogado
   -- Los criterios de aceptacion ordenados por nivel
   -- Las restricciones_llm en context_engineering

2. ESTRUCTURA DEL ESCRITO.
   I.    Encabezado (partes, expediente, despacho)
   II.   Excepciones previas (si algun CA Critico lo requiere)
   III.  Contestacion de hechos (hecho por hecho)
   IV.   Defensas de fondo (siguiendo la decision_estrategica)
   V.    Defensa subsidiaria (si aplica)
   VI.   Ofrecimiento de prueba
   VII.  Petitoria

3. TRAZABILIDAD: etiqueta [CA-XX] al inicio de cada parrafo
   de fondo que satisface un criterio.

4. LA DECISION_ESTRATEGICA ES SAGRADA. No incorpores argumentos
   de opciones descartadas en el cuerpo principal.

5. LAS RESTRICCIONES_LLM SON ABSOLUTAS.

6. Si un criterio no puede satisfacerse, senalalo:
   [CA-XX SIN SATISFACER: motivo]

7. Usa solo normas del mapa_normativo. Jurisprudencia adicional
   va como [SUGERENCIA -- verificar].

8. REPORTE DE QA AL FINAL:
   Criterios satisfechos / pendientes / sin prueba
   Restricciones respetadas: Si / No
   Notas para el abogado

9. Texto en espanol juridico formal. Sin markdown.

SPEC JSON:
{spec_json}

EJECUTA.`;

// ---------------------------------------------------------------------------
// Gemini API
// ---------------------------------------------------------------------------
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

async function callGemini(prompt, apiKey, model) {
  model = model || DEFAULT_MODEL;
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 16000 },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  const candidates = data.candidates;
  if (!candidates || !candidates.length) {
    throw new Error("El modelo no devolvi\u00f3 respuesta.");
  }
  const parts = candidates[0].content && candidates[0].content.parts;
  if (!parts || !parts.length) {
    const reason = candidates[0].finishReason || "unknown";
    throw new Error(
      `El modelo no gener\u00f3 respuesta (finishReason=${reason}). ` +
      `Esto puede ocurrir por filtros de seguridad de Google.`
    );
  }
  return parts[0].text;
}

// ---------------------------------------------------------------------------
// JSON extraction (mirrors parser.py)
// ---------------------------------------------------------------------------
function extractJson(text) {
  let clean = text.trim();

  // Remove markdown code fences
  if (clean.startsWith("```")) {
    const lines = clean.split("\n");
    let start = 1;
    let end = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === "```") { end = i; break; }
    }
    clean = lines.slice(start, end).join("\n");
  }

  try { return [JSON.parse(clean), true]; } catch (_) {}

  const braceStart = clean.indexOf("{");
  const braceEnd = clean.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    try { return [JSON.parse(clean.slice(braceStart, braceEnd + 1)), true]; } catch (_) {}
  }

  return [clean, false];
}

// ---------------------------------------------------------------------------
// Report builder (mirrors report.py)
// ---------------------------------------------------------------------------
function buildReport(modelName, demandSource, specJson, strategy, draftText) {
  const sep = "=".repeat(70);
  const dash = "-".repeat(70);
  const dashShort = "-".repeat(40);
  const ts = new Date().toLocaleString("es-CR");

  function fmtSpec(s) {
    if (typeof s !== "object") return String(s);
    const lines = [];
    const caso = s.caso || {};
    lines.push(`  Tipo: ${caso.tipo || "N/A"}`);
    lines.push(`  Materia: ${caso.materia || "N/A"}`);
    lines.push(`  Expediente: ${caso.expediente || "N/A"}`);
    lines.push(`  Jurisdiccion: ${caso.jurisdiccion || "N/A"}`);
    const partes = s.partes || {};
    const cl = partes.cliente || {};
    const co = partes.contraparte || {};
    if (cl.nombre) lines.push(`  Cliente: ${cl.nombre} (${cl.rol_procesal || ""})`);
    if (co.nombre) lines.push(`  Contraparte: ${co.nombre} (${co.rol_procesal || ""})`);
    return lines.join("\n");
  }

  function fmtOptions(opts) {
    return (opts || []).map((o, i) =>
      `  Opcion ${i+1}:\n    Descripcion: ${o.descripcion || ""}\n    Ventaja: ${o.ventaja || ""}\n    Riesgo: ${o.riesgo || ""}${o.requiere_investigacion_previa ? `\n    Investigacion requerida: ${o.requiere_investigacion_previa}` : ""}\n`
    ).join("\n");
  }

  function fmtCriteria(crs) {
    return (crs || []).map(c =>
      `  ${c.codigo || ""} [${c.nivel || ""}] ${c.descripcion || ""}\n    Satisfecho: ${c.satisfecho ? "SI" : "NO"}${c.prueba_requerida ? `\n    Prueba requerida: ${c.prueba_requerida}` : ""}\n`
    ).join("\n");
  }

  function fmtNorms(norms) {
    return (norms || []).map(n =>
      `  ${n.fuente || ""} - ${n.referencia || ""}\n    Favorece a: ${n.favorece_a || ""}\n    Criterios: ${(n.criterios_que_satisface || []).join(", ")}\n    Resumen: ${n.resumen || ""}\n`
    ).join("\n");
  }

  const res = (typeof specJson === "object") ? (specJson.resultado_esperado || {}) : {};
  const opciones = res.opciones || [];
  const restricciones = res.restricciones_criticas || [];
  const criterios = (typeof specJson === "object") ? (specJson.criterios_aceptacion || []) : [];
  const mapa = (typeof specJson === "object") ? (specJson.mapa_normativo || []) : [];

  return `${sep}
REPORTE SDD LEGAL - PROCESO COMPLETO DE DECISION
${sep}
Fecha: ${ts}
Modelo: ${modelName}
Modo: NUBE (Google AI Studio - datos procesados por Google)
Fuente de demanda: ${demandSource}
${sep}


PASO 1: ANALISIS DE LA DEMANDA (generado por IA)
${dash}

Datos del caso:
${fmtSpec(specJson)}


Opciones estrategicas identificadas:
${dashShort}
${fmtOptions(opciones)}

Restricciones criticas detectadas:
${dashShort}
${restricciones.map(r => `  - ${r}`).join("\n")}


Criterios de aceptacion definidos:
${dashShort}
${fmtCriteria(criterios)}

Mapa normativo:
${dashShort}
${fmtNorms(mapa)}


${sep}
PASO 2: DECISION ESTRATEGICA (tomada por el abogado)
${sep}

${strategy}


${sep}
PASO 3: ESCRITO DE CONTESTACION (generado por IA, siguiendo la spec)
${sep}

${draftText}


${sep}
PASO 4: RESUMEN DE TRAZABILIDAD
${sep}

Modelo utilizado: ${modelName}
Modo de ejecucion: NUBE (Google AI Studio)
Opciones presentadas: ${opciones.length}
Criterios definidos: ${criterios.length}
Normas mapeadas: ${mapa.length}

Decision estrategica: tomada por el abogado (Paso 2)
Redaccion: ejecutada por IA siguiendo la spec (Paso 3)
Reporte de QA: incluido al final del escrito (Paso 3)

NOTA: Este reporte documenta el proceso completo de decision.
El escrito de contestacion es un borrador generado por IA.
Debe ser revisado, validado y aprobado por el abogado
responsable antes de cualquier uso procesal.
${sep}
`;
}

// ---------------------------------------------------------------------------
// File readers (PDF, DOCX, HTML, TXT)
// ---------------------------------------------------------------------------
async function readFileAsText(file) {
  const name = file.name.toLowerCase();

  // Plain text
  if (name.endsWith(".txt")) {
    return await file.text();
  }

  // HTML
  if (name.endsWith(".html") || name.endsWith(".htm")) {
    const html = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || doc.body.innerText || "";
  }

  // PDF (requires pdf.js loaded via CDN)
  if (name.endsWith(".pdf")) {
    if (typeof pdfjsLib === "undefined") {
      throw new Error("PDF.js no se carg\u00f3. Verifique su conexi\u00f3n a internet.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str).join(" "));
    }
    return pages.join("\n\n");
  }

  // DOCX (requires mammoth.js loaded via CDN)
  if (name.endsWith(".docx")) {
    if (typeof mammoth === "undefined") {
      throw new Error("Mammoth.js no se carg\u00f3. Verifique su conexi\u00f3n a internet.");
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  // Fallback: try as text
  return await file.text();
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
let state = {
  apiKey: localStorage.getItem("sdd_api_key") || "",
  model: DEFAULT_MODEL,
  demandText: "",
  demandSource: "ejemplo",
  specJson: null,
  strategy: "",
  draftText: "",
  reportText: "",
  opciones: [],  // populated after step 1
};

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Restore API key
  if (state.apiKey) {
    $("#api-key-input").value = state.apiKey;
  }

  // Load example demand into textarea
  $("#demand-text").value = DEMANDA_EJEMPLO;
  state.demandText = DEMANDA_EJEMPLO;

  // --- Event listeners ---

  // Save API key
  $("#btn-save-key").addEventListener("click", () => {
    const key = $("#api-key-input").value.trim();
    if (!key) return;
    state.apiKey = key;
    localStorage.setItem("sdd_api_key", key);
    $("#key-status").textContent = "Key guardada";
    $("#key-status").style.color = "var(--green)";
    setTimeout(() => { $("#key-status").textContent = ""; }, 2000);
  });

  // Test API key connection
  $("#btn-test-key").addEventListener("click", testConnection);

  // File upload for custom demand (supports txt, html, pdf, docx)
  $("#demand-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      $("#demand-text").value = text;
      state.demandText = text;
      state.demandSource = file.name;
    } catch (err) {
      alert("Error al leer el archivo: " + err.message);
    }
  });

  // Use example button
  $("#btn-use-example").addEventListener("click", () => {
    $("#demand-text").value = DEMANDA_EJEMPLO;
    state.demandText = DEMANDA_EJEMPLO;
    state.demandSource = "ejemplo";
    $("#demand-file").value = "";
  });

  // Step 1: Analyze
  $("#btn-analyze").addEventListener("click", runStep1);

  // Step 2: Confirm strategy
  $("#btn-confirm-strategy").addEventListener("click", runStep2);

  // Step 4: Download
  $("#btn-download").addEventListener("click", downloadReport);
});

// ---------------------------------------------------------------------------
// Test connection
// ---------------------------------------------------------------------------
async function testConnection() {
  const key = $("#api-key-input").value.trim();
  if (!key) {
    alert("Ingrese su API Key primero.");
    return;
  }

  const statusEl = $("#key-status");
  const btn = $("#btn-test-key");
  btn.disabled = true;
  statusEl.textContent = "Probando...";
  statusEl.style.color = "var(--fg-dim)";

  try {
    const model = $("#model-select").value || DEFAULT_MODEL;
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${key}`;
    const body = {
      contents: [{ parts: [{ text: "Responde solo: OK" }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      statusEl.textContent = "Conexi\u00f3n exitosa";
      statusEl.style.color = "var(--green)";
      // Auto-save on success
      state.apiKey = key;
      localStorage.setItem("sdd_api_key", key);
    } else {
      const err = await resp.json().catch(() => ({}));
      const msg = (err.error && err.error.message) || `Error ${resp.status}`;
      statusEl.textContent = "Error: " + msg;
      statusEl.style.color = "var(--red)";
    }
  } catch (err) {
    statusEl.textContent = "Sin conexi\u00f3n: " + err.message;
    statusEl.style.color = "var(--red)";
  }

  btn.disabled = false;
  setTimeout(() => { statusEl.textContent = ""; }, 5000);
}

// ---------------------------------------------------------------------------
// Step 1: Analysis
// ---------------------------------------------------------------------------
async function runStep1() {
  state.demandText = $("#demand-text").value.trim();
  if (!state.demandText) {
    alert("Ingrese el texto de la demanda.");
    return;
  }
  if (!state.apiKey) {
    state.apiKey = $("#api-key-input").value.trim();
    if (!state.apiKey) {
      alert("Ingrese su API Key de Google AI Studio.");
      return;
    }
    localStorage.setItem("sdd_api_key", state.apiKey);
  }

  state.model = $("#model-select").value || DEFAULT_MODEL;

  const btn = $("#btn-analyze");
  const status = $("#step1-status");
  btn.disabled = true;
  status.innerHTML = '<span class="spinner"></span> Analizando demanda y generando spec...';
  show(status);
  hide($("#step1-result"));

  try {
    const schemaStr = JSON.stringify(SCHEMA_SDD, null, 2);
    const prompt = PROMPT_ANALYSIS
      .replace("{demand}", state.demandText)
      .replace("{schema}", schemaStr);

    const raw = await callGemini(prompt, state.apiKey, state.model);
    const [parsed, ok] = extractJson(raw);

    state.specJson = parsed;

    // Show results
    status.innerHTML = "";
    hide(status);

    renderStep1Results(parsed, ok);
    populateStrategyDropdown(parsed);
    show($("#step1-result"));
    show($("#step2-header"));
    show($("#step2-section"));

    // Mark step 1 done
    $("#step1-header").classList.add("step-done");
    $("#step2-header").classList.add("step-active");
  } catch (err) {
    status.innerHTML = `<span style="color:var(--red)">[ERROR] ${err.message}</span>`;
    btn.disabled = false;
  }
}

function renderStep1Results(spec, ok) {
  const container = $("#step1-result");
  container.innerHTML = "";

  if (!ok || typeof spec !== "object") {
    container.innerHTML = `<div class="output-box">${typeof spec === "string" ? spec : JSON.stringify(spec, null, 2)}</div>`;
    return;
  }

  // Options table
  const resultado = spec.resultado_esperado || {};
  const opciones = resultado.opciones || [];
  if (opciones.length) {
    let html = `<div class="panel panel-blue"><div class="panel-title">Opciones estrat\u00e9gicas</div><table>
      <tr><th>#</th><th>Descripcion</th><th>Ventaja</th><th>Riesgo</th></tr>`;
    opciones.forEach((o, i) => {
      html += `<tr><td>${i+1}</td><td>${esc(o.descripcion || "")}</td><td>${esc(o.ventaja || "")}</td><td style="color:var(--red)">${esc(o.riesgo || "")}</td></tr>`;
    });
    html += "</table></div>";
    container.innerHTML += html;
  }

  // Restrictions
  const restricciones = resultado.restricciones_criticas || [];
  if (restricciones.length) {
    let html = `<div class="panel panel-red"><div class="panel-title">Restricciones cr\u00edticas</div><ul class="restrictions-list">`;
    restricciones.forEach(r => { html += `<li>${esc(r)}</li>`; });
    html += "</ul></div>";
    container.innerHTML += html;
  }

  // Criteria table
  const criterios = spec.criterios_aceptacion || [];
  if (criterios.length) {
    const levelClass = { "Critico": "tag-critical", "Importante": "tag-important", "Defensa": "tag-defense", "Contexto": "tag-context" };
    let html = `<div class="panel panel-green"><div class="panel-title">Criterios de aceptaci\u00f3n</div><table>
      <tr><th>Codigo</th><th>Descripcion</th><th>Nivel</th></tr>`;
    criterios.forEach(c => {
      const cls = levelClass[c.nivel] || "";
      html += `<tr><td>${esc(c.codigo || "")}</td><td>${esc(c.descripcion || "")}</td><td><span class="tag ${cls}">${esc(c.nivel || "")}</span></td></tr>`;
    });
    html += "</table></div>";
    container.innerHTML += html;
  }
}

// ---------------------------------------------------------------------------
// Populate strategy dropdown from step 1 results
// ---------------------------------------------------------------------------
function populateStrategyDropdown(spec) {
  const select = $("#strategy-select");
  select.innerHTML = '<option value="">-- Seleccione una opci\u00f3n --</option>';

  if (typeof spec !== "object") return;

  const resultado = spec.resultado_esperado || {};
  const opciones = resultado.opciones || [];
  state.opciones = opciones;

  opciones.forEach((o, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Opci\u00f3n ${i + 1}: ${o.descripcion || ""}`;
    select.appendChild(opt);
  });
}

// ---------------------------------------------------------------------------
// Step 2: Strategy decision
// ---------------------------------------------------------------------------
function runStep2() {
  const selectVal = $("#strategy-select").value;
  if (selectVal === "") {
    alert("Seleccione una opci\u00f3n estrat\u00e9gica antes de continuar.");
    return;
  }

  const idx = parseInt(selectVal);
  const opcion = state.opciones[idx];
  const notes = $("#strategy-notes").value.trim();

  // Build strategy text
  let text = `Opci\u00f3n ${idx + 1}: ${opcion.descripcion || ""}`;
  if (notes) {
    text += `\nNotas del abogado: ${notes}`;
  }
  state.strategy = text;

  // Inject into spec
  if (state.specJson && typeof state.specJson === "object" && state.specJson.resultado_esperado) {
    state.specJson.resultado_esperado.decision_estrategica = text;
  }

  // Mark step 2 done
  $("#step2-header").classList.remove("step-active");
  $("#step2-header").classList.add("step-done");
  $("#btn-confirm-strategy").disabled = true;
  $("#strategy-select").disabled = true;
  $("#strategy-notes").disabled = true;

  // Start step 3
  show($("#step3-header"));
  show($("#step3-section"));
  $("#step3-header").classList.add("step-active");
  runStep3();
}

// ---------------------------------------------------------------------------
// Step 3: Drafting
// ---------------------------------------------------------------------------
async function runStep3() {
  const status = $("#step3-status");
  status.innerHTML = '<span class="spinner"></span> Redactando contestaci\u00f3n siguiendo la spec...';
  show(status);
  hide($("#step3-result"));

  try {
    const specStr = (typeof state.specJson === "object")
      ? JSON.stringify(state.specJson, null, 2)
      : String(state.specJson);

    const prompt = PROMPT_DRAFT.replace("{spec_json}", specStr);
    const raw = await callGemini(prompt, state.apiKey, state.model);

    state.draftText = raw;

    status.innerHTML = "";
    hide(status);

    $("#step3-result").innerHTML = `<div class="output-box">${esc(raw)}</div>`;
    show($("#step3-result"));

    // Mark step 3 done
    $("#step3-header").classList.remove("step-active");
    $("#step3-header").classList.add("step-done");

    // Build report and show step 4
    state.reportText = buildReport(
      state.model,
      state.demandSource,
      state.specJson,
      state.strategy,
      state.draftText,
    );

    show($("#step4-header"));
    show($("#step4-section"));
    $("#step4-header").classList.add("step-done");
    renderStep4();
  } catch (err) {
    status.innerHTML = `<span style="color:var(--red)">[ERROR] ${err.message}</span>`;
  }
}

// ---------------------------------------------------------------------------
// Step 4: Report (enhanced display)
// ---------------------------------------------------------------------------
function renderStep4() {
  const spec = state.specJson;
  const isObj = typeof spec === "object";
  const criterios = isObj ? (spec.criterios_aceptacion || []) : [];
  const mapa = isObj ? (spec.mapa_normativo || []) : [];
  const resultado = isObj ? (spec.resultado_esperado || {}) : {};
  const opciones = resultado.opciones || [];
  const restricciones = resultado.restricciones_criticas || [];
  const caso = isObj ? (spec.caso || {}) : {};
  const partes = isObj ? (spec.partes || {}) : {};
  const cliente = partes.cliente || {};
  const contra = partes.contraparte || {};

  let html = "";

  // Case summary
  html += `<div class="panel panel-blue">
    <div class="panel-title">Datos del caso</div>
    <table>
      <tr><td style="width:160px;font-weight:600">Tipo</td><td>${esc(caso.tipo || "N/A")}</td></tr>
      <tr><td style="font-weight:600">Materia</td><td>${esc(caso.materia || "N/A")}</td></tr>
      <tr><td style="font-weight:600">Expediente</td><td>${esc(caso.expediente || "N/A")}</td></tr>
      <tr><td style="font-weight:600">Jurisdicción</td><td>${esc(caso.jurisdiccion || "N/A")}</td></tr>
      <tr><td style="font-weight:600">Cliente</td><td>${esc(cliente.nombre || "N/A")} (${esc(cliente.rol_procesal || "")})</td></tr>
      <tr><td style="font-weight:600">Contraparte</td><td>${esc(contra.nombre || "N/A")} (${esc(contra.rol_procesal || "")})</td></tr>
    </table>
  </div>`;

  // Strategy chosen
  html += `<div class="panel panel-yellow">
    <div class="panel-title">Decisión estratégica (tomada por el profesional)</div>
    <p style="white-space:pre-wrap">${esc(state.strategy)}</p>
  </div>`;

  // Criteria status
  if (criterios.length) {
    const levelClass = { "Critico": "tag-critical", "Importante": "tag-important", "Defensa": "tag-defense", "Contexto": "tag-context" };
    html += `<div class="panel panel-green">
      <div class="panel-title">Estado de criterios de aceptación</div>
      <table>
        <tr><th>Código</th><th>Descripción</th><th>Nivel</th><th>Satisfecho</th></tr>`;
    criterios.forEach(c => {
      const cls = levelClass[c.nivel] || "";
      const sat = c.satisfecho
        ? '<span style="color:var(--green);font-weight:700">SI</span>'
        : '<span style="color:var(--red);font-weight:700">NO</span>';
      html += `<tr>
        <td style="font-weight:600">${esc(c.codigo || "")}</td>
        <td>${esc(c.descripcion || "")}</td>
        <td><span class="tag ${cls}">${esc(c.nivel || "")}</span></td>
        <td style="text-align:center">${sat}</td>
      </tr>`;
    });
    html += "</table></div>";
  }

  // Traceability summary
  html += `<div class="panel">
    <div class="panel-title">Resumen de trazabilidad</div>
    <table>
      <tr><td style="width:200px">Modelo utilizado</td><td>${esc(state.model)}</td></tr>
      <tr><td>Modo de ejecución</td><td>Nube (Google AI Studio)</td></tr>
      <tr><td>Opciones presentadas</td><td>${opciones.length}</td></tr>
      <tr><td>Criterios definidos</td><td>${criterios.length}</td></tr>
      <tr><td>Normas mapeadas</td><td>${mapa.length}</td></tr>
    </table>
  </div>`;

  // Disclaimer
  html += `<div class="warning">
    <strong>NOTA:</strong> Este reporte documenta el proceso completo de decisión.
    El escrito es un borrador generado por IA. Debe ser revisado, validado y aprobado
    por el profesional responsable antes de cualquier uso.
  </div>`;

  $("#step4-result").innerHTML = html;
  show($("#step4-result"));
}

// ---------------------------------------------------------------------------
// DOCX Report Generator
// ---------------------------------------------------------------------------
async function downloadReport() {
  if (typeof docx === "undefined") {
    alert("La librería docx.js no se cargó. Verifique su conexión a internet.");
    return;
  }

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
    PageBreak, Header, Footer, TableLayoutType
  } = docx;

  const spec = state.specJson;
  const isObj = typeof spec === "object";
  const caso = isObj ? (spec.caso || {}) : {};
  const partes = isObj ? (spec.partes || {}) : {};
  const cliente = partes.cliente || {};
  const contra = partes.contraparte || {};
  const resultado = isObj ? (spec.resultado_esperado || {}) : {};
  const opciones = resultado.opciones || [];
  const restricciones = resultado.restricciones_criticas || [];
  const criterios = isObj ? (spec.criterios_aceptacion || []) : [];
  const mapa = isObj ? (spec.mapa_normativo || []) : [];
  const ts = new Date().toLocaleString("es-CR");

  // Color palette
  const BLUE = "1e40af";
  const BLUE_LIGHT = "dbeafe";
  const GREEN = "166534";
  const GREEN_LIGHT = "dcfce7";
  const YELLOW = "854d0e";
  const YELLOW_LIGHT = "fef9c3";
  const RED = "991b1b";
  const RED_LIGHT = "fee2e2";
  const GRAY = "6b7280";
  const GRAY_LIGHT = "f3f4f6";
  const WHITE = "ffffff";

  // Helper: styled heading paragraph
  function heading(text, level) {
    return new Paragraph({
      heading: level,
      spacing: { before: 300, after: 120 },
      children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22, color: BLUE })],
    });
  }

  // Helper: normal paragraph
  function para(text, opts = {}) {
    return new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text, size: 20, color: opts.color || "333333", bold: opts.bold || false, italics: opts.italic || false })],
    });
  }

  // Helper: table cell
  function cell(text, opts = {}) {
    return new TableCell({
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
      children: [new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: text || "", size: 18, bold: opts.bold || false, color: opts.color || "333333" })],
      })],
    });
  }

  // Helper: header cell (blue)
  function hCell(text, width) {
    return cell(text, { bold: true, color: WHITE, shading: BLUE, width });
  }

  // Helper: two-column info row
  function infoRow(label, value) {
    return new TableRow({
      children: [
        cell(label, { bold: true, shading: GRAY_LIGHT, width: 30 }),
        cell(value, { width: 70 }),
      ],
    });
  }

  const children = [];

  // ===== TITLE =====
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "REPORTE SDD LEGAL", size: 36, bold: true, color: BLUE })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Proceso completo de decisión", size: 24, color: GRAY })],
  }));

  // ===== META INFO TABLE =====
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      infoRow("Fecha", ts),
      infoRow("Modelo", state.model),
      infoRow("Modo", "Nube (Google AI Studio)"),
      infoRow("Fuente", state.demandSource),
    ],
  }));
  children.push(para(""));

  // ===== PASO 1 =====
  children.push(heading("PASO 1: Análisis de la demanda", HeadingLevel.HEADING_1));
  children.push(para("Generado por IA — el modelo analizó la demanda y produjo la especificación.", { italic: true, color: GRAY }));

  // Case data
  children.push(heading("Datos del caso", HeadingLevel.HEADING_2));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      infoRow("Tipo", caso.tipo || "N/A"),
      infoRow("Materia", caso.materia || "N/A"),
      infoRow("Expediente", caso.expediente || "N/A"),
      infoRow("Jurisdicción", caso.jurisdiccion || "N/A"),
      infoRow("Cliente", `${cliente.nombre || "N/A"} (${cliente.rol_procesal || ""})`),
      infoRow("Contraparte", `${contra.nombre || "N/A"} (${contra.rol_procesal || ""})`),
    ],
  }));
  children.push(para(""));

  // Strategic options
  if (opciones.length) {
    children.push(heading("Opciones estratégicas", HeadingLevel.HEADING_2));
    const optRows = [new TableRow({ children: [hCell("#", 8), hCell("Descripción", 37), hCell("Ventaja", 27), hCell("Riesgo", 28)] })];
    opciones.forEach((o, i) => {
      optRows.push(new TableRow({
        children: [
          cell(String(i + 1), { bold: true }),
          cell(o.descripcion || ""),
          cell(o.ventaja || ""),
          cell(o.riesgo || "", { color: RED }),
        ],
      }));
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: optRows }));
    children.push(para(""));
  }

  // Restrictions
  if (restricciones.length) {
    children.push(heading("Restricciones críticas", HeadingLevel.HEADING_2));
    restricciones.forEach(r => {
      children.push(new Paragraph({
        spacing: { after: 60 },
        bullet: { level: 0 },
        children: [new TextRun({ text: r, size: 20, color: RED })],
      }));
    });
    children.push(para(""));
  }

  // Criteria
  if (criterios.length) {
    children.push(heading("Criterios de aceptación", HeadingLevel.HEADING_2));
    const crRows = [new TableRow({ children: [hCell("Código", 12), hCell("Descripción", 50), hCell("Nivel", 18), hCell("Satisfecho", 12), hCell("Prueba", 8)] })];
    criterios.forEach(c => {
      const nivelColor = { "Critico": RED, "Importante": YELLOW, "Defensa": BLUE, "Contexto": GRAY }[c.nivel] || GRAY;
      crRows.push(new TableRow({
        children: [
          cell(c.codigo || "", { bold: true }),
          cell(c.descripcion || ""),
          cell(c.nivel || "", { color: nivelColor, bold: true }),
          cell(c.satisfecho ? "SI" : "NO", { color: c.satisfecho ? GREEN : RED, bold: true }),
          cell(c.prueba_requerida ? "Si" : "-"),
        ],
      }));
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: crRows }));
    children.push(para(""));
  }

  // Normative map
  if (mapa.length) {
    children.push(heading("Mapa normativo", HeadingLevel.HEADING_2));
    const nRows = [new TableRow({ children: [hCell("Fuente", 25), hCell("Referencia", 15), hCell("Favorece a", 15), hCell("Criterios", 15), hCell("Resumen", 30)] })];
    mapa.forEach(n => {
      const favColor = (n.favorece_a === "cliente") ? GREEN : (n.favorece_a === "contraparte") ? RED : GRAY;
      nRows.push(new TableRow({
        children: [
          cell(n.fuente || ""),
          cell(n.referencia || ""),
          cell(n.favorece_a || "", { color: favColor, bold: true }),
          cell((n.criterios_que_satisface || []).join(", ")),
          cell(n.resumen || ""),
        ],
      }));
    });
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: nRows }));
    children.push(para(""));
  }

  // ===== PASO 2 =====
  children.push(heading("PASO 2: Decisión estratégica", HeadingLevel.HEADING_1));
  children.push(para("Tomada por el profesional — la IA presentó opciones, NO decidió.", { italic: true, color: GRAY }));
  children.push(new Paragraph({
    spacing: { before: 100, after: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: YELLOW } },
    indent: { left: 200 },
    children: [new TextRun({ text: state.strategy, size: 22, bold: true, color: "1a1a1a" })],
  }));

  // ===== PASO 3 =====
  children.push(heading("PASO 3: Escrito de contestación", HeadingLevel.HEADING_1));
  children.push(para("Generado por IA siguiendo la spec y la decisión estratégica.", { italic: true, color: GRAY }));

  // Split draft into paragraphs, parsing **bold** markdown
  function parseTextRuns(text, defaultColor, allBold) {
    const runs = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: 20, color: defaultColor, bold: allBold || false }));
      }
      runs.push(new TextRun({ text: match[1], size: 20, color: defaultColor, bold: true }));
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      runs.push(new TextRun({ text: text.slice(lastIndex), size: 20, color: defaultColor, bold: allBold || false }));
    }
    return runs.length ? runs : [new TextRun({ text, size: 20, color: defaultColor, bold: allBold || false })];
  }

  const draftLines = state.draftText.split("\n");
  draftLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(para(""));
      return;
    }
    // Highlight [CA-XX] tags
    const caMatch = trimmed.match(/^\[CA-\d+/);
    const color = caMatch ? BLUE : "333333";
    children.push(new Paragraph({ spacing: { after: 60 }, children: parseTextRuns(trimmed, color, !!caMatch) }));
  });
  children.push(para(""));

  // ===== PASO 4 =====
  children.push(heading("PASO 4: Resumen de trazabilidad", HeadingLevel.HEADING_1));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      infoRow("Modelo utilizado", state.model),
      infoRow("Modo de ejecución", "Nube (Google AI Studio)"),
      infoRow("Opciones presentadas", String(opciones.length)),
      infoRow("Criterios definidos", String(criterios.length)),
      infoRow("Normas mapeadas", String(mapa.length)),
      infoRow("Decisión estratégica", "Tomada por el profesional (Paso 2)"),
      infoRow("Redacción", "Ejecutada por IA siguiendo la spec (Paso 3)"),
      infoRow("Reporte de QA", "Incluido al final del escrito (Paso 3)"),
    ],
  }));

  // Disclaimer
  children.push(para(""));
  children.push(new Paragraph({
    spacing: { before: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: RED } },
    indent: { left: 200 },
    children: [
      new TextRun({ text: "NOTA: ", size: 20, bold: true, color: RED }),
      new TextRun({
        text: "Este reporte documenta el proceso completo de decisión. El escrito es un borrador generado por IA. Debe ser revisado, validado y aprobado por el profesional responsable antes de cualquier uso.",
        size: 20, color: GRAY,
      }),
    ],
  }));

  // Build document
  const doc = new Document({
    creator: "SDD Legal",
    title: "Reporte SDD Legal",
    description: "Proceso completo de decisión - Spec-Driven Development Jurídico",
    sections: [{
      properties: {
        page: {
          margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "SDD Legal — Reporte de decisión", size: 16, color: GRAY, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Generado: ${ts} | Modelo: ${state.model}`, size: 14, color: GRAY })],
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const tsFile = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `sdd_reporte_${tsFile}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------
function esc(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
