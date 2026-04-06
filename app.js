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
    throw new Error("El modelo no devolvio respuesta.");
  }
  const parts = candidates[0].content && candidates[0].content.parts;
  if (!parts || !parts.length) {
    const reason = candidates[0].finishReason || "unknown";
    throw new Error(
      `El modelo no genero respuesta (finishReason=${reason}). ` +
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
      throw new Error("PDF.js no se cargo. Verifique su conexion a internet.");
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
      throw new Error("Mammoth.js no se cargo. Verifique su conexion a internet.");
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
      statusEl.textContent = "Conexion exitosa";
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
    statusEl.textContent = "Sin conexion: " + err.message;
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
    let html = `<div class="panel panel-blue"><div class="panel-title">Opciones estrategicas</div><table>
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
    let html = `<div class="panel panel-red"><div class="panel-title">Restricciones criticas</div><ul class="restrictions-list">`;
    restricciones.forEach(r => { html += `<li>${esc(r)}</li>`; });
    html += "</ul></div>";
    container.innerHTML += html;
  }

  // Criteria table
  const criterios = spec.criterios_aceptacion || [];
  if (criterios.length) {
    const levelClass = { "Critico": "tag-critical", "Importante": "tag-important", "Defensa": "tag-defense", "Contexto": "tag-context" };
    let html = `<div class="panel panel-green"><div class="panel-title">Criterios de aceptacion</div><table>
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
  select.innerHTML = '<option value="">-- Seleccione una opcion --</option>';

  if (typeof spec !== "object") return;

  const resultado = spec.resultado_esperado || {};
  const opciones = resultado.opciones || [];
  state.opciones = opciones;

  opciones.forEach((o, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Opcion ${i + 1}: ${o.descripcion || ""}`;
    select.appendChild(opt);
  });
}

// ---------------------------------------------------------------------------
// Step 2: Strategy decision
// ---------------------------------------------------------------------------
function runStep2() {
  const selectVal = $("#strategy-select").value;
  if (selectVal === "") {
    alert("Seleccione una opcion estrategica antes de continuar.");
    return;
  }

  const idx = parseInt(selectVal);
  const opcion = state.opciones[idx];
  const notes = $("#strategy-notes").value.trim();

  // Build strategy text
  let text = `Opcion ${idx + 1}: ${opcion.descripcion || ""}`;
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
  status.innerHTML = '<span class="spinner"></span> Redactando contestacion siguiendo la spec...';
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
// Step 4: Report
// ---------------------------------------------------------------------------
function renderStep4() {
  const criterios = (typeof state.specJson === "object")
    ? (state.specJson.criterios_aceptacion || [])
    : [];
  const mapa = (typeof state.specJson === "object")
    ? (state.specJson.mapa_normativo || [])
    : [];
  const opciones = (typeof state.specJson === "object" && state.specJson.resultado_esperado)
    ? (state.specJson.resultado_esperado.opciones || [])
    : [];

  let html = `<div class="panel panel-green">
    <div class="panel-title">Resumen de trazabilidad</div>
    <table>
      <tr><td>Modelo utilizado</td><td>${esc(state.model)}</td></tr>
      <tr><td>Opciones presentadas</td><td>${opciones.length}</td></tr>
      <tr><td>Criterios definidos</td><td>${criterios.length}</td></tr>
      <tr><td>Normas mapeadas</td><td>${mapa.length}</td></tr>
      <tr><td>Decision estrategica</td><td>Tomada por el abogado (Paso 2)</td></tr>
    </table>
  </div>`;

  html += `<div class="warning">
    NOTA: Este reporte documenta el proceso completo de decision.
    El escrito de contestacion es un borrador generado por IA.
    Debe ser revisado, validado y aprobado por el abogado
    responsable antes de cualquier uso procesal.
  </div>`;

  $("#step4-result").innerHTML = html;
  show($("#step4-result"));
}

function downloadReport() {
  const blob = new Blob([state.reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `sdd_reporte_${ts}.txt`;
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
