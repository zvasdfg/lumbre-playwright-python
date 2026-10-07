"use client";
import { type FormEvent, useEffect, useRef, useState } from "react";
import PrintableSheet from "./printable-sheet";
import PlanGuide from "./fire-plan-guide";
import { FuelAvailability } from "./fire-plan-fuel";
import { type Configuration, type Equipment, type FuelType, type Method, type Preset, type Stage, equipmentLabels, fuelLabels, methodLabels, compatibleFuels, initialConfiguration, requiresFuelCheck, needsCapability, capabilityLabel, fuelGuidance, issues, decodePresets, presetSchema, STORAGE_KEY } from "./fire-plan-model";
import { defaultTemperature, goalLabels, goalHelp, type Goal, capability, hasSmoke, surfaceLabels, type Surface, stageSchema } from "./fire-plan-model";
import "./fire-plan-sheet.css";
const quickPlans: Array<{
    name: string;
    description: string;
    configuration: Configuration;
}> = [
    { name: "Comida directa", description: "Parrilla con tapa · carbón · directo", configuration: initialConfiguration },
    { name: "Indirecto con humo", description: "Vertical · briquetas · indirecto y ahumado", configuration: { ...initialConfiguration, equipment: "ahumador", fuelType: "briquetas", cookingStyle: "indirecto", goal: "ahumar", temperature: defaultTemperature("ahumar", "indirecto"), smoking: false } },
    { name: "Dos zonas", description: "Parrilla con tapa · carbón · combinado", configuration: { ...initialConfiguration, cookingStyle: "dos_zonas", temperature: defaultTemperature("asar", "dos_zonas") } },
];
export default function FirePlanner() {
    const outputRef = useRef<HTMLElement>(null), errorRef = useRef<HTMLDivElement>(null), formRef = useRef<HTMLFormElement>(null), storedRaw = useRef<string | null>(null);
    const [configuration, setConfiguration] = useState<Configuration>(initialConfiguration);
    const [generated, setGenerated] = useState(false), [errors, setErrors] = useState<string[]>([]), [customize, setCustomize] = useState(false);
    const [presetName, setPresetName] = useState(""), [editingId, setEditingId] = useState<string | null>(null);
    const [presets, setPresets] = useState<Preset[]>([]), [message, setMessage] = useState("");
    const [ready, setReady] = useState(false), [blocked, setBlocked] = useState(false);
    const [printPreset, setPrintPreset] = useState<Preset | null>(null), [replacement, setReplacement] = useState<Preset | null>(null);
    const [deleted, setDeleted] = useState<{
        preset: Preset;
        index: number;
    } | null>(null);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            try {
                storedRaw.current = localStorage.getItem(STORAGE_KEY);
                setPresets(decodePresets(storedRaw.current));
            }
            catch {
                setBlocked(true);
                setMessage("No pudimos leer todos tus planes. No modificaremos el almacenamiento para evitar perder datos. Conserva una copia antes de repararlo.");
            }
            setReady(true);
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    function update<Key extends keyof Configuration>(key: Key, value: Configuration[Key]) {
        setConfiguration(current => {
            const next = { ...current, [key]: value };
            if (["equipment", "fuelType", "goal", "cookingStyle", "temperature", "stages", "kettleDiameter"].includes(key)) { next.fuelRate = ""; next.fuelStartup = ""; }
            if (key === "equipment" || key === "fuelType")
                next.fuelVerified = false;
            if (key === "equipment" || key === "cookingStyle" || key === "stages" || key === "goal")
                next.capabilityVerified = false;
            if (key === "equipment" || key === "smoking" || key === "stages" || key === "goal")
                next.smokeVerified = false;
            if (key === "equipment" && compatibleFuels[next.equipment].length && !compatibleFuels[next.equipment].includes(next.fuelType))
                next.fuelType = compatibleFuels[next.equipment][0];
            if (key === "goal" && !next.stages.length) {
                next.cookingStyle = next.goal === "asar" && next.equipment !== "pellets" ? "directo" : "indirecto";
                next.smoking = false;
            }
            if (key === "equipment" && next.equipment === "pellets" && !next.stages.length) next.cookingStyle = "indirecto";
            if (key === "stages") {
                const methods = [...new Set(next.stages.filter(s => s.kind !== "pausa").map(s => s.method))];
                if (methods.length) next.cookingStyle = methods.length > 1 ? "dos_zonas" : methods[0];
            }
            if (key === "temperature") next.temperatureSuggested = false;
            if (["goal", "cookingStyle", "equipment", "unit", "stages"].includes(key) && (current.temperatureSuggested || !current.temperature)) {
                next.temperature = defaultTemperature(next.goal, next.cookingStyle, next.unit);
                next.temperatureSuggested = true;
            }
            return next;
        });
        setGenerated(false);
        setErrors([]);
        setReplacement(null);
        setMessage("");
    }
    function validate() { const problems = issues(configuration); setErrors(problems); if (problems.length) {
        setGenerated(false);
        window.requestAnimationFrame(() => errorRef.current?.focus());
        return false;
    } return true; }
    function build(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (validate()) {
        setGenerated(true);
        window.requestAnimationFrame(() => { outputRef.current?.focus({ preventScroll: true }); outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); });
    } }
    function previewCurrentPlan() {
        if (!generated || !validate()) return;
        setPrintPreset({ id: "unsaved-print-preview", name: presetName.trim() || "Mi plan de fuego", configuration });
    }
    function apply(next: Configuration, name = "", id: string | null = null) {
        setConfiguration(next);
        setPresetName(name);
        setEditingId(id);
        setReplacement(null);
        setErrors(issues(next));
        setGenerated(issues(next).length === 0);
        setCustomize(false);
        setMessage(id ? "Editando " + name + ". Los cambios se guardan sólo cuando lo confirmes." : "Punto de partida cargado. Revisa objetivo, equipo y combustible.");
        window.requestAnimationFrame(() => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); formRef.current?.querySelector<HTMLElement>("select")?.focus({ preventScroll: true }); });
    }
    function persist(next: Preset[]) {
        if (!ready || blocked)
            return false;
        try {
            if (localStorage.getItem(STORAGE_KEY) !== storedRaw.current) {
                setBlocked(true);
                setMessage("Los planes cambiaron en otra pestaña. Recarga antes de guardar para no sobrescribirlos.");
                return false;
            }
            if (storedRaw.current !== null && localStorage.getItem(STORAGE_KEY + ".before-editor-v2") === null)
                localStorage.setItem(STORAGE_KEY + ".before-editor-v2", storedRaw.current);
            const raw = JSON.stringify(next);
            localStorage.setItem(STORAGE_KEY, raw);
            storedRaw.current = raw;
            setPresets(next);
            return true;
        }
        catch {
            setMessage("No se pudo guardar. Comprueba el espacio y permisos del navegador; tus cambios siguen en el formulario.");
            return false;
        }
    }
    function commit(candidate: Preset) {
        if (issues(candidate.configuration).length || !presetSchema.safeParse(candidate).success) {
            setMessage("Revisa los datos del plan antes de guardar.");
            return;
        }
        const exists = presets.some(p => p.id === candidate.id);
        if (!exists && presets.length >= 50) {
            setMessage("Llegaste a 50 planes. Elimina uno que no necesites antes de crear otro.");
            return;
        }
        if (!persist(exists ? presets.map(p => p.id === candidate.id ? candidate : p) : [...presets, candidate]))
            return;
        setReplacement(null);
        setEditingId(candidate.id);
        setPresetName(candidate.name);
        setMessage("Plan " + candidate.name + " guardado en este navegador.");
    }
    function copyName(name: string) { let i = 1, result = name.slice(0, 65) + " · copia " + i; while (presets.some(p => p.name.toLocaleLowerCase("es") === result.toLocaleLowerCase("es")))
        result = name.slice(0, 65) + " · copia " + (++i); return result; }
    function save() {
        if (!validate())
            return;
        const name = presetName.trim();
        if (!name || name.length > 80) {
            setMessage("Pon un nombre de hasta 80 caracteres.");
            return;
        }
        const existing = presets.find(p => p.name.toLocaleLowerCase("es") === name.toLocaleLowerCase("es")) || presets.find(p => p.id === editingId);
        const candidate: Preset = { ...existing, id: existing?.id || crypto.randomUUID(), name, configuration };
        if (existing)
            setReplacement(candidate);
        else
            commit(candidate);
    }
    function undo() {
        if (!deleted)
            return;
        if (presets.length >= 50 || presets.some(p => p.id === deleted.preset.id || p.name.toLocaleLowerCase("es") === deleted.preset.name.toLocaleLowerCase("es"))) {
            setMessage("No se puede restaurar: hay otro plan con ese nombre o alcanzaste el límite de 50. Cambia el nombre del nuevo plan o libera un espacio.");
            return;
        }
        const next = [...presets];
        next.splice(deleted.index, 0, deleted.preset);
        if (persist(next)) {
            setMessage("Plan " + deleted.preset.name + " restaurado.");
            setDeleted(null);
        }
    }
    function stage(index: number, key: keyof Stage, value: string) { update("stages", configuration.stages.map((s, i) => i === index ? { ...s, [key]: value } : s)); }
    return <section className="fire-planner-section" id="planificador" aria-labelledby="fire-planner-title" data-testid="fire-planner">
    <div className="planner-heading"><div><p className="section-index">02 — PLANIFICADOR DE FUEGO</p><h2 id="fire-planner-title">Diseña el fuego<br />antes de encender.</h2></div><p>Elige objetivo, equipo, combustible y horas. Revisa qué cantidad podemos estimar antes de construir tu guía. La temperatura ya tiene una sugerencia editable. Guarda e imprime el plan para tenerlo a mano.</p></div>
    <div className="quick-plans" aria-label="Planes rápidos"><span>PUNTO DE PARTIDA</span>{quickPlans.map(p => <button key={p.name} type="button" onClick={() => apply(p.configuration)}>{p.name}<small>{p.description}</small></button>)}</div>
    <div className="planner-workspace"><form className="planner-controls" ref={formRef} onSubmit={build}>
      <div className="planner-panel-heading"><span>01</span><div><strong>PREPARA TU EQUIPO</strong><small>Objetivo, equipo, combustible y horas. La temperatura ya tiene un punto de partida.</small></div></div>
      <div className="planner-form-grid"><label>¿Qué quieres hacer?<select aria-label="Objetivo de cocción" name="goal" value={configuration.goal} onChange={e => update("goal", e.target.value as Goal)}>{Object.entries(goalLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label>Equipo<select aria-label="Equipo" name="equipment" value={configuration.equipment} onChange={e => update("equipment", e.target.value as Equipment)}>{Object.entries(equipmentLabels).map(([v, l]) => <option key={v} value={v} disabled={v !== "no_soportado" && capability(v as Equipment, configuration.goal) === "no_compatible"}>{l}{capability(v as Equipment, configuration.goal) === "condicionado" ? " · verificar montaje" : capability(v as Equipment, configuration.goal) === "no_compatible" && v !== "no_soportado" ? " · no compatible" : ""}</option>)}</select></label><label>Combustible<select aria-label="Combustible principal" name="fuelType" disabled={compatibleFuels[configuration.equipment].length <= 1} value={configuration.fuelType} onChange={e => update("fuelType", e.target.value as FuelType)}>{!compatibleFuels[configuration.equipment].includes(configuration.fuelType) && <option value={configuration.fuelType}>Revisar combustible</option>}{compatibleFuels[configuration.equipment].map(v => <option key={v} value={v}>{fuelLabels[v]}{requiresFuelCheck(configuration.equipment, v) ? " · verificar modelo" : ""}</option>)}</select></label><label>Montaje del calor<select disabled={configuration.goal !== "asar" || configuration.stages.some(s => s.kind !== "pausa")} aria-label="Tipo de cocción" name="cookingStyle" value={configuration.cookingStyle} onChange={e => update("cookingStyle", e.target.value as Method)}>{Object.entries(methodLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Horas de cocción<input aria-label="Horas de cocción" name="durationHours" type="number" min="0.1" max="48" step="any" placeholder="Ej. 2" value={configuration.durationHours} onChange={e => update("durationHours", e.target.value)}/><small>Tiempo previsto cocinando; no incluye encendido ni precalentamiento.</small></label><label>Temperatura del asador (°{configuration.unit})<input aria-label="Temperatura de trabajo" name="temperature" maxLength={40} value={configuration.temperature} onChange={e => update("temperature", e.target.value)}/><small>{configuration.temperatureSuggested ? "Punto de partida sugerido, editable." : "Temperatura personalizada; se conserva al cambiar de método."}</small><button className="planner-temperature-reset" type="button" onClick={() => { update("temperature", defaultTemperature(configuration.goal, configuration.cookingStyle, configuration.unit)); update("temperatureSuggested", true); }}>Usar sugerida</button></label></div>
      <p className="planner-help">La temperatura corresponde al asador, no al interior del alimento. En combinado es una referencia de trabajo, no una temperatura idéntica en ambas zonas. {configuration.stages.length > 0 && "Este plan tiene etapas guardadas; revisa sus temperaturas en Detalles del plan."}</p>
      <p className="planner-help" role="status">{goalHelp[configuration.goal]} {capability(configuration.equipment, configuration.goal) === "no_compatible" && "Elige otro equipo para este objetivo; no se ha cambiado tu selección."}</p><p className="planner-help">Directo: calor bajo el alimento. Indirecto: calor separado, con tapa. Combinado: ambas zonas o etapas. En parrilla abierta, la zona sin brasas sólo es de retirada.</p><p className="planner-help" role="status">{fuelGuidance(configuration.equipment)}</p>
      {requiresFuelCheck(configuration.equipment, configuration.fuelType) && <label className="planner-check"><input type="checkbox" name="fuelVerified" checked={configuration.fuelVerified} onChange={e => update("fuelVerified", e.target.checked)}/>Mi manual admite este combustible principal, no sólo como complemento aromático.</label>}
      <details className="planner-customize" open={customize} onToggle={e => setCustomize(e.currentTarget.open)}><summary>Detalles del plan · opcional{configuration.stages.length > 0 ? ` · ${configuration.stages.length} etapas` : ""}</summary>
        <div className="planner-form-grid"><label>Unidad de tus temperaturas<select aria-label="Unidad de temperatura" value={configuration.unit} onChange={e => update("unit", e.target.value as "C" | "F")}><option value="C">°C</option><option value="F">°F</option></select><small>Convierte la sugerencia automáticamente. Si escribiste tu propia temperatura o tienes etapas, revisa sus cifras al cambiar la unidad.</small></label><label>Soporte del alimento<select aria-label="Soporte del alimento" name="surface" value={configuration.surface} onChange={e => update("surface", e.target.value as Surface)}>{Object.entries(surfaceLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label>Accesorios / montaje<input name="accessory" maxLength={160} placeholder="Ej. deflector, plancha, rotisserie…" value={configuration.accessory} onChange={e => update("accessory", e.target.value)}/></label></div>
        <p className="planner-help">No necesitas completar estos detalles para crear un plan sencillo. Las etapas permiten registrar recetas con varios pasos.</p>
        <label className="planner-check"><input type="checkbox" name="smoking" checked={configuration.smoking} onChange={e => update("smoking", e.target.checked)}/>Añadir aporte de humo (opcional, además del objetivo)</label>
        {hasSmoke(configuration) && <label>{configuration.equipment === "pellets" ? "Variedad de pellets (opcional)" : "Madera aromática (opcional)"}<input name="smokeWood" maxLength={120} value={configuration.smokeWood} onChange={e => update("smokeWood", e.target.value)} placeholder="Tipo y presentación permitidos por el modelo"/></label>}

        <label>Enlace a tu receta<input name="recipeUrl" type="url" maxLength={1000} value={configuration.recipeUrl} placeholder="https://…" onChange={e => update("recipeUrl", e.target.value)}/></label>
        <section className="planner-stage-editor" aria-label="Etapas del fuego"><h3>Etapas / en el orden que las usarás</h3><p className="planner-help">Puedes cambiar el objetivo por etapa. El montaje general se ajusta a tu secuencia: directo, indirecto o combinado. Si sólo hay una fase, no necesitas añadir etapas.</p>
          {configuration.stages.length === 0 && <div className="planner-stage-actions"><button type="button" onClick={() => { update("stages", [stageSchema.parse({ name: "Cocinar con calor indirecto", goal: configuration.goal, method: "indirecto" }), stageSchema.parse({ name: "Sellar con calor directo", goal: "asar", method: "directo" })]); update("cookingStyle", "dos_zonas"); }}>Crear secuencia: indirecto → sellado</button><button type="button" onClick={() => update("stages", [stageSchema.parse({ name: "Primera cocción", method: configuration.cookingStyle === "directo" ? "directo" : "indirecto" }), stageSchema.parse({ name: "Continuar cubierto", method: configuration.cookingStyle === "directo" ? "directo" : "indirecto", surface: "bandeja" })])}>Crear secuencia: cocinar → cubrir</button><small>Sin temperaturas ni tiempos inventados. Completa los datos de tu receta.</small></div>}
          {configuration.stages.map((s, i) => <fieldset key={i}><legend>Etapa {i + 1}</legend><label>Tipo de etapa {i + 1}<select aria-label={"Tipo de etapa " + (i + 1)} value={s.kind || "coccion"} onChange={e => update("stages", configuration.stages.map((item, n) => n === i ? { ...item, kind: e.target.value as "coccion" | "pausa", temperature: e.target.value === "pausa" ? "" : item.temperature } : item))}><option value="coccion">Cocción</option><option value="pausa">Pausa fuera del fuego</option></select><small>Una pausa borra la temperatura de asador de esta etapa.</small></label><label>Nombre de etapa {i + 1}<input maxLength={80} value={s.name} onChange={e => stage(i, "name", e.target.value)}/></label><label>Objetivo de etapa {i + 1}<select aria-label={"Objetivo de etapa " + (i + 1)} disabled={s.kind === "pausa"} value={s.goal || ""} onChange={e => update("stages", configuration.stages.map((item, n) => n === i ? { ...item, goal: e.target.value ? e.target.value as Goal : undefined, method: e.target.value && e.target.value !== "asar" ? "indirecto" : item.method } : item))}><option value="">Usar objetivo general</option>{Object.entries(goalLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label>Método de etapa {i + 1}<select aria-label={"Método de etapa " + (i + 1)} disabled={s.kind === "pausa"} value={s.method} onChange={e => stage(i, "method", e.target.value)}><option value="directo">Directo</option><option value="indirecto">Indirecto</option></select></label><label>Temperatura de etapa {i + 1} (°{configuration.unit})<input disabled={s.kind === "pausa"} maxLength={40} value={s.temperature} onChange={e => stage(i, "temperature", e.target.value)}/></label><label>Soporte de etapa {i + 1}<select aria-label={"Soporte de etapa " + (i + 1)} disabled={s.kind === "pausa"} value={s.surface || ""} onChange={e => update("stages", configuration.stages.map((item, n) => n === i ? { ...item, surface: e.target.value ? e.target.value as Surface : undefined } : item))}><option value="">Usar soporte general</option>{Object.entries(surfaceLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label><label>Duración o señal para cambiar {i + 1}<input maxLength={80} placeholder="Ej. 30 min o señal indicada por tu receta" value={s.duration} onChange={e => stage(i, "duration", e.target.value)}/></label><label>Notas de etapa {i + 1}<textarea maxLength={500} value={s.notes} onChange={e => stage(i, "notes", e.target.value)}/></label><div className="planner-stage-actions"><button type="button" disabled={i === 0} onClick={() => { const next = [...configuration.stages]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; update("stages", next); }}>Subir etapa {i + 1}</button><button type="button" onClick={() => update("stages", configuration.stages.filter((_, n) => n !== i))}>Quitar etapa {i + 1}</button></div></fieldset>)}
          <button type="button" disabled={configuration.stages.length >= 12} onClick={() => update("stages", [...configuration.stages, { name: "", method: configuration.cookingStyle === "directo" ? "directo" : "indirecto", temperature: "", duration: "", notes: "" }])}>Añadir etapa</button><small>Hasta 12 etapas; sus datos proceden de tu receta.</small>
        </section><label>Notas y observaciones<textarea name="notes" rows={5} maxLength={3000} value={configuration.notes} onChange={e => update("notes", e.target.value)} placeholder="Combustible utilizado, recargas, montaje y qué cambiarías…"/></label>
      </details>
      {hasSmoke(configuration) && configuration.equipment === "gas" && <label className="planner-check"><input type="checkbox" name="smokeVerified" checked={configuration.smokeVerified} onChange={e => update("smokeVerified", e.target.checked)}/>Mi fabricante permite el accesorio de ahumado que voy a usar.</label>}
      {needsCapability(configuration) && <label className="planner-check"><input type="checkbox" name="capabilityVerified" checked={configuration.capabilityVerified} onChange={e => update("capabilityVerified", e.target.checked)}/>{capabilityLabel(configuration)}</label>}
      {errors.length > 0 && <div className="planner-validation" role="alert" tabIndex={-1} ref={errorRef}><strong>Revisa antes de continuar</strong><ul>{errors.map(p => <li key={p}>{p}</li>)}</ul></div>}
      <FuelAvailability c={configuration}/>
      <p className="planner-help">{configuration.equipment === "kettle" ? `Referencia de tamaño: kettle de ${configuration.kettleDiameter} cm. Puedes cambiarla abajo.` : configuration.equipment === "pellets" ? "Referencia de consumo: Weber SmokeFire; no es una calibración de todos los equipos de pellets." : "Se usan referencias verificadas cuando existen para esta combinación."} Los ajustes manuales son opcionales.</p>
      <details className="planner-reference-settings"><summary>Ajustes de referencia (opcional)</summary>
      {configuration.equipment === "kettle" && <label>Diámetro de la parrilla<select aria-label="Diámetro de la parrilla" value={configuration.kettleDiameter} onChange={e => update("kettleDiameter", e.target.value as Configuration["kettleDiameter"])}><option value="47">47 cm</option><option value="57">57 cm · referencia inicial</option><option value="67">67 cm</option></select><small>Confirma el diámetro real. Para otro tamaño, utiliza el consumo medido de tu equipo.</small></label>}
      <fieldset className="planner-fuel-inputs"><legend>Consumo de combustible</legend><p>Si conoces el consumo de tu equipo, úsalo aquí. El kettle tiene una referencia de carga inicial y, con briquetas en indirecto, de reserva por duración. Pellets usa referencias en ciertos rangos. Los datos manuales son opcionales y sustituyen la referencia cuando se proporcionan.</p><div className="planner-form-grid"><label>Consumo por hora ({configuration.fuelType === "gas_natural" ? "m³/h" : "kg/h"})<input aria-label="Consumo por hora" inputMode="decimal" value={configuration.fuelRate} onChange={e => update("fuelRate", e.target.value)} placeholder="Del manual o de una sesión medida"/><small>Para gas LP introduce kg/h, no litros ni BTU/h. Usa una tasa para el equipo, combustible y montaje elegidos.</small></label><label>Precalentamiento (min)<input aria-label="Precalentamiento" type="number" min="0" max="240" value={configuration.preheatMinutes} onChange={e => update("preheatMinutes", e.target.value)}/><small>30 min es un margen de tiempo editable, no una instrucción de encendido.</small></label></div><details><summary>Arranque adicional, si tu medición no lo incluye</summary><label>Combustible de arranque ({configuration.fuelType === "gas_natural" ? "m³" : "kg"})<input aria-label="Combustible de arranque" inputMode="decimal" value={configuration.fuelStartup} onChange={e => update("fuelStartup", e.target.value)}/><small>Déjalo vacío si ya queda incluido en el consumo horario durante el precalentamiento. No equivale a la capacidad de la cesta.</small></label></details></fieldset>
      </details>
      <button className="button button-primary planner-calculate" type="submit">Construir plan de fuego</button>
    </form><section className="planner-output" aria-label="Plan de fuego" ref={outputRef} tabIndex={-1}><div className="planner-panel-heading"><span>02</span><div><strong>PLAN DE CAMPO</strong><small>Lo elegido, lo pendiente y cómo prepararlo.</small></div></div>{generated ? <div className="planner-result"><p role="status" aria-label="Plan de fuego listo">Guía generada. Revisa los datos pendientes antes de encender.</p><button className="button button-primary" type="button" onClick={previewCurrentPlan}>Imprimir / PDF</button><p className="planner-help">Abre la ficha para imprimir o guardar como PDF. No necesitas guardar el plan.</p><PlanGuide configuration={configuration}/></div> : <div className="planner-empty"><span aria-hidden="true">↗</span><h3>Tu plan aparecerá aquí.</h3><p>Revisa objetivo, equipo, combustible y montaje. Si cambias un dato, vuelve a construir el plan.</p></div>}</section></div>
    <section className="preset-library" aria-labelledby="preset-title"><div className="preset-copy"><p className="section-index" data-testid="preset-storage-scope">MEMORIA LOCAL</p><h3 id="preset-title">Tus fuegos repetibles.</h3><p>Guarda, edita o duplica tu plan. Se conserva sólo en este navegador; no se sincroniza con otros dispositivos. Borrar los datos del navegador elimina los guardados.</p></div><div className="preset-create"><label>Nombre del plan<input maxLength={80} value={presetName} onChange={e => { setPresetName(e.target.value); setReplacement(null); }} placeholder="Ej. Costillas del domingo"/></label><button type="button" onClick={save} disabled={!presetName.trim() || !ready || blocked}>Guardar plan</button></div>
      {message && <p className="preset-message" role="status">{message}</p>}
      {replacement && <div className="preset-confirm" role="group" aria-label="Confirmar reemplazo"><p>Ya existe un plan que se actualizará: <strong>{presets.find(p => p.id === replacement.id)?.name}</strong>. ¿Reemplazarlo o conservar ambos?</p><button type="button" onClick={() => commit(replacement)}>Confirmar reemplazo</button><button type="button" onClick={() => commit({ ...replacement, id: crypto.randomUUID(), name: copyName(replacement.name) })}>Guardar como copia</button><button type="button" onClick={() => setReplacement(null)}>Cancelar</button></div>}
      {deleted && <div className="preset-undo"><span>Último eliminado: {deleted.preset.name}. Puedes recuperarlo mientras sigas en esta página.</span><button type="button" onClick={undo}>Deshacer eliminación</button></div>}
      <div className="preset-list" data-testid="fire-presets">{presets.map(p => <article key={p.id}><span>{equipmentLabels[p.configuration.equipment]} · {p.configuration.durationHours ? p.configuration.durationHours + " h de fuego" : "Tiempo sin definir"}</span><h4>{p.name}</h4><p>{goalLabels[p.configuration.goal]} · {methodLabels[p.configuration.cookingStyle]} · {fuelLabels[p.configuration.fuelType]}</p>{issues(p.configuration).length > 0 && <p className="fire-plan-caution">Revisión necesaria antes de usar o imprimir.</p>}<div><button type="button" onClick={() => apply(p.configuration, p.name, p.id)} aria-label={"Editar plan " + p.name}>Editar</button><button type="button" onClick={() => apply(p.configuration, copyName(p.name))} aria-label={"Duplicar plan " + p.name}>Duplicar</button><button type="button" onClick={() => { const problems = issues(p.configuration); if (problems.length) {
        setMessage("No se puede imprimir " + p.name + ": " + problems.join(" ") + " Abre Editar para corregirlo.");
        return;
    } setPrintPreset(p); }} aria-label={"Imprimir plan " + p.name}>Ver / imprimir</button><button type="button" onClick={() => { if (persist(presets.filter(item => item.id !== p.id))) {
        setDeleted({ preset: p, index: presets.indexOf(p) });
        setReplacement(null);
        setMessage("Plan " + p.name + " eliminado. Puedes deshacerlo.");
    } }} aria-label={"Eliminar plan " + p.name}>Eliminar</button></div></article>)}{!presets.length && <p className="preset-empty">Aún no hay planes guardados. Dale nombre al primero para conservarlo.</p>}</div>
    </section>
    {printPreset && <PrintableSheet titleId="fire-plan-title" closeLabel="Cerrar plan imprimible" onClose={() => setPrintPreset(null)}><article className="fire-plan-print"><header><img src="/brand/lumbre-mark-red.png" width="80" height="80" alt="Lumbre"/><div><p>PLAN DE FUEGO / GUÍA PERSONAL</p><h2 id="fire-plan-title">{printPreset.name}</h2></div></header><PlanGuide configuration={printPreset.configuration}/><footer>REGISTRO EN CAMPO / Fecha: __________<br />Combustible utilizado: __________ Recargas: __________<br />Observaciones: __________________________________________________</footer></article></PrintableSheet>}
  </section>;
}
