import type { Configuration } from "./fire-plan-model";
import { issues, fuelLabels, defaultTemperature } from "./fire-plan-model";

export const fuelSources = {
  pellets: "https://contact-emea.weber.com/hc/en-us/articles/360048814014-Pellet-Consumption-SmokeFire",
  solid: "https://www.weber.com/GB/en/weber-briquettes/weber-49393.html",
  gas: "https://contact-emea.weber.com/hc/pt/articles/32729720804381-Resumo-do-Consumo-das-Churrasqueiras-Weber-Spirit",
};
const number = (s: string) => Number(s.replace(",", "."));
const up = (n: number) => Math.ceil((n - 1e-9) * 10) / 10;
export function estimateFuel(c: Configuration) {
  const unit = c.fuelType === "gas_natural" ? "m³" : "kg";
  if (issues(c).length) return { unit, reason: "Corrige la configuración antes de calcular." };
  if (!c.durationHours) return { unit, reason: "Indica las horas de cocción para calcular el combustible." };
  const hours = Number(c.durationHours), preheat = number(c.preheatMinutes || "30") / 60;
  const startup = number(c.fuelStartup || "0");
  let low = number(c.fuelRate || "0"), high = low, source = "Consumo aportado por ti para esta configuración.";
  let sourceUrl = "", assumptions = "Tu consumo medido sustituye los valores automáticos.", extrapolated = false, minimum = 0;
  // Lumbre v4: explicit planning assumptions, NOT manufacturer measurements.
  // With stages, use the envelope of all active temperatures for the whole session;
  // free-text durations are intentionally not guessed or added to general hours.
  const active = c.stages.filter(s => s.kind !== "pausa");
  const texts = active.length ? active.map(s => s.temperature || defaultTemperature(s.goal || c.goal, s.method, c.unit)) : [c.temperature || defaultTemperature(c.goal, c.cookingStyle, c.unit)];
  const temperatures = texts.flatMap(t => t.split(/[-–]/).map(v => number(v.trim())).map(v => c.unit === "F" ? (v - 32) * 5 / 9 : v));
  const lo = Math.min(...temperatures), hi = Math.max(...temperatures);
  const heat = (t: number) => Math.max(.45, Math.min(2.2, (t - 20) / 180));
  if (!low && c.equipment === "pellets") {
    const band = (t: number) => {
      if (t >= 95 && t <= 150) return [.5, 1];
      if (t >= 230 && t <= 315) return [1.5, 2];
      const fraction = Math.max(-.25, Math.min(1.75, (t - 150) / 80));
      return [Math.max(.25, .5 + fraction), Math.max(.75, 1 + fraction)];
    };
    low = band(lo)[0]; high = band(hi)[1]; sourceUrl = fuelSources.pellets;
    extrapolated = active.length > 0 || !(lo >= 95 && hi <= 150 || lo >= 230 && hi <= 315);
    source = extrapolated ? "Lumbre interpola o extrapola las bandas de Weber SmokeFire; Weber no publica esta cifra exacta." : "Referencia Weber SmokeFire: 0.5–1 kg/h a 95–150 °C; 1.5–2 kg/h a 230–315 °C.";
    assumptions = "Equipo doméstico tipo SmokeFire, pellets secos y tapa cerrada. Entre 150 y 230 °C se interpolan linealmente los extremos; fuera de las bandas se prolonga la tendencia con límites de planificación.";
  }
  if (!low && c.equipment === "gas") {
    const dutyLow = Math.max(.25, Math.min(.85, heat(lo) * .45));
    const dutyHigh = Math.max(.5, Math.min(1, heat(hi) * .85));
    // 7–8.7 kW / assumed 10 kWh per m³ for NG; never convert LP kg to NG m³.
    low = (c.fuelType === "gas_natural" ? .7 : .494) * dutyLow;
    high = (c.fuelType === "gas_natural" ? .87 : .623) * dutyHigh;
    sourceUrl = fuelSources.gas; extrapolated = true;
    source = "Estimación Lumbre a partir de potencias y consumos publicados para Weber Spirit de 2–3 quemadores.";
    assumptions = `Asador doméstico de 2–3 quemadores, sin quemador lateral; uso parcial estimado de ${Math.round(dutyLow * 100)}–${Math.round(dutyHigh * 100)}% de potencia. ${c.fuelType === "gas_natural" ? "Para gas natural se asumen 10 kWh/m³: conversión energética aproximada de Lumbre, no caudal certificado por Weber." : "Referencia LP de 0.494–0.623 kg/h a potencia nominal; el factor de uso parcial es de Lumbre."} No extrapolar a equipos grandes o comerciales.`;
  }
  if (!low && ["carbon", "briquetas", "lena"].includes(c.fuelType) && c.equipment !== "no_soportado") {
    const equipmentFactor = { kettle: 1, kamado: .75, ahumador: 1.2, offset: 2, abierta: 1.5, gas: 1, pellets: 1, no_soportado: 1 }[c.equipment];
    const area = c.equipment === "kettle" ? (Number(c.kettleDiameter) / 57) ** 2 : 1;
    const fuelFactor = c.fuelType === "lena" ? 2.5 : c.fuelType === "carbon" ? 1.15 : 1;
    const base = 2 / 3 * equipmentFactor * area * fuelFactor;
    low = base * heat(lo) * .7; high = base * heat(hi) * 1.4;
    minimum = (c.fuelType === "carbon" ? .98 : c.fuelType === "lena" ? 3 : 2) * area * Math.min(1.5, equipmentFactor);
    extrapolated = true; sourceUrl = fuelSources.solid;
    source = "Estimación Lumbre: ancla Weber de aproximadamente 2 kg de briquetas para kettle de 57 cm y calor de hasta 3 h; no es una tasa medida universal.";
    assumptions = `Base 2/3 kg/h. Factores Lumbre: equipo ×${equipmentFactor}, combustible ×${fuelFactor}, tamaño ×${area.toFixed(2)}, calor (°C − 20)/180 limitado a 0.45–2.2; rango ×0.7–1.4. Mínimo de compra ${minimum.toFixed(1)} kg, no carga de encendido. Se asume equipo doméstico comparable a 57 cm, combustible seco y poco viento. Los factores, especialmente leña y offset, son hipótesis sin calibración.`;
  }
  if (!low) return { unit, reason: "Sin referencia automática de Weber verificada para esta combinación. Puedes conservar la simulación sin cifra de consumo; los datos manuales quedan como ajuste opcional." };
  // Budget only: same hourly rate for the explicitly stated warm-up allowance.
  // 25% is a planning margin, not a statistical confidence interval.
  const rawLow = startup + low * (hours + preheat), rawHigh = startup + high * (hours + preheat);
  const provision = Math.max(rawHigh, minimum);
  return { unit, low: up(rawLow), high: up(rawHigh), reserve: up(provision * .25), total: up(up(provision) + up(provision * .25)), source, sourceUrl, assumptions, extrapolated, minimum, rateLow: low, rateHigh: high, preheat, startup, hours };
}
export function kettleFuelReference(c: Configuration) {
  if (c.equipment !== "kettle" || !["carbon", "briquetas"].includes(c.fuelType) || c.fuelRate || c.goal === "ahumar" || c.cookingStyle === "dos_zonas" || c.stages.length || issues(c).length) return null;
  const index = ["47", "57", "67"].indexOf(c.kettleDiameter);
  const indirect = c.cookingStyle === "indirecto";
  const initial = indirect ? [20, 30, 40][index] : [25, 30, 45][index];
  const additions = indirect && c.durationHours ? Math.max(0, Math.ceil(Number(c.durationHours)) - 1) * [8, 8, 12][index] : null;
  const session = c.fuelType === "briquetas" && additions !== null ? initial + additions : null;
  const reserve = session === null ? null : Math.ceil(session * .25);
  return { initial, additions, indirect, session, reserve, total: session === null || reserve === null ? null : session + reserve, charcoalKg: indirect ? [.6, .6, .84][index] : [.56, .98, 2.24][index] };
}
export function fuelAvailability(c: Configuration) {
  if (issues(c).length) return { title: "Revisa la configuración", detail: "Confirma el montaje y corrige los datos indicados para consultar el combustible." };
  const kettle = kettleFuelReference(c);
  if (kettle && c.fuelType === "briquetas" && kettle.indirect) return { title: "Presupuesto por duración disponible", detail: c.durationHours ? `Prepara ${kettle.total} briquetas: ${kettle.initial} iniciales + ${kettle.additions} para recargas + ${kettle.reserve} de reserva.` : "Introduce las horas: calcularemos carga inicial, recargas y reserva en briquetas Weber." };
  const estimate = estimateFuel({ ...c, durationHours: c.durationHours || "1" });
  if (!("reason" in estimate)) return { title: c.fuelRate ? "Presupuesto con tu consumo medido" : estimate.extrapolated ? "Estimación aproximada Lumbre" : "Rango de consumo disponible", detail: !c.durationHours ? "Sólo faltan las horas de cocción. Usaremos los supuestos del equipo, sin pedir más datos." : `Prepara aproximadamente ${estimate.total} ${estimate.unit}, con reserva incluida. ${c.fuelRate ? "Usamos tu consumo manual." : "No enciendas todo a la vez. Consulta los supuestos en el resultado."}` };
  return { title: "Sin cálculo automático para este plan", detail: c.stages.length ? "Esta secuencia no tiene una referencia de consumo verificada. Puedes generar la guía, pero no incluirá una cantidad de combustible." : "Puedes generar la guía de montaje, pero esta combinación todavía no incluye una cantidad de combustible verificada." };
}
export function FuelAvailability({ c }: { c: Configuration }) {
  const availability = fuelAvailability(c);
  return <aside className="planner-fuel-availability" aria-label="Disponibilidad del cálculo de combustible" aria-live="polite"><strong>{availability.title}</strong><p>{availability.detail}</p></aside>;
}
export default function FuelEstimate({ c }: { c: Configuration }) {
  const estimate = estimateFuel(c);
  const kettle = kettleFuelReference(c);
  if (kettle && kettle.total !== null) return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible">
    <span>REFERENCIA KETTLE · {c.kettleDiameter} CM · CONFIRMA EL TAMAÑO</span>
    <h3>{kettle.total !== null ? `Prepara ${kettle.total} briquetas` : c.fuelType === "briquetas" ? kettle.initial + " briquetas iniciales" : kettle.charcoalKg + " kg iniciales de carbón de haya"}</h3>
    {kettle.total !== null ? <>
      <p>Para {c.durationHours} h en indirecto, con reserva incluida. No enciendas todo a la vez.</p>
      <dl className="fire-plan-facts"><div><dt>Carga inicial · ambos lados</dt><dd>{kettle.initial} briquetas</dd></div><div><dt>Recargas previstas</dt><dd>{kettle.additions} briquetas</dd></div><div><dt>Reserva Lumbre · 25%</dt><dd>{kettle.reserve} briquetas</dd></div></dl>
      <p>Referencia para briquetas Weber; no equivale a cualquier tamaño o marca.</p>
      <details className="fuel-calculation-details"><summary>Cómo se calcula y qué incluye</summary><p>La tabla Weber indica 4 briquetas por lado y hora adicional en 47/57 cm; 6 en 67 cm. Las fracciones se presupuestan como hora completa. Lumbre añade una reserva del 25%, redondeada a piezas enteras. No se convierte a kg porque el peso por briqueta varía. El encendido forma parte de esa carga; no se suma otra por precalentamiento.</p></details>
    </> : <><p><strong>Sólo carga inicial, no el total de la sesión.</strong> {kettle.indirect ? "Primera hora en indirecto, sumando ambos lados." : "Referencia para montaje directo."} Cambiar las horas no calcula recargas.</p><p>{c.fuelType === "carbon" ? "El peso publicado corresponde a carbón de haya, no a mezquite, encino ni leña. No hay un peso verificado para las recargas." : "La tabla de directo no publica una tasa de recarga por hora."}</p></>}
    <p>La leña aromática se anota por separado y no se descuenta del carbón. No sustituye automáticamente el combustible principal. Para quemar leños, verifica la autorización del modelo.</p>
    <a href="https://www.weber.com/on/demandware.static/-/Sites-master-catalog/default/dwfb3a6638/documents/50b1bdb6-f0fe-409d-b9b3-50f312950392.pdf" target="_blank" rel="noreferrer">Weber: tabla de cargas, página 8 · referencia, no calibración de tu equipo</a>
  </section>;
  if ("reason" in estimate) return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible"><span>GUÍA SIN PRESUPUESTO DE COMBUSTIBLE</span><h3>{c.durationHours ? "Cantidad no disponible" : "Falta indicar la duración"}</h3><p>{estimate.reason}</p></section>;
  const fmt = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 1 });
  return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible">
    <span>{c.fuelRate ? "ESTIMACIÓN CON TU CONSUMO" : estimate.extrapolated ? "ESTIMACIÓN LUMBRE · EXTRAPOLADA, NO CALIBRADA" : "REFERENCIA WEBER · PRESUPUESTO LUMBRE"}</span>
    <h3>{fmt(estimate.low)}{estimate.high !== estimate.low ? "–" + fmt(estimate.high) : ""} {estimate.unit} de consumo estimado</h3>
    <p>{fuelLabels[c.fuelType]}. {estimate.rateHigh / estimate.rateLow >= 4 ? "Rango amplio: no hay una banda específica publicada para esta temperatura. " : ""}No es una medición de tu sesión.</p>
    <dl className="fire-plan-facts"><div><dt>Prepara · presupuesto conservador</dt><dd>{fmt(estimate.total)} {estimate.unit}</dd></div><div><dt>Reserva incluida · 25% del presupuesto base</dt><dd>{fmt(estimate.reserve)} {estimate.unit}</dd></div></dl>
    <p>{estimate.minimum ? `El presupuesto toma el mayor entre el consumo máximo y un mínimo de compra de ${fmt(estimate.minimum)} ${estimate.unit}, más reserva.` : "El presupuesto suma el consumo máximo y la reserva."} Es combustible disponible, no una carga que debas encender de una vez.</p>
    <p>{estimate.source} Incluye {fmt(estimate.hours)} h de cocción + {fmt(estimate.preheat * 60)} min de precalentamiento presupuestado{estimate.startup ? " + " + fmt(estimate.startup) + " " + estimate.unit + " de arranque adicional" : ""}.</p>
    <details className="fuel-calculation-details"><summary>Supuestos, cálculo y fuente</summary><p>{estimate.assumptions}</p><p>Consumo horario × tiempo total + arranque adicional. El presupuesto usa el máximo entre ese consumo y el mínimo de compra, más 25% de reserva. Redondeo hacia arriba a 0.1. Modelo de planificación Lumbre v4; no validado con mediciones de tu equipo. No incluye madera aromática adicional ni descuenta carbón por añadirla. Carga, capacidad y recargas: sigue el manual.</p></details>
    {c.stages.length > 0 && <p>Se usa un rango que cubre las temperaturas de todas las etapas, no una suma de consumos por etapa. Las temperaturas vacías usan la sugerencia del método sólo para este presupuesto. Las horas generales deben cubrir el tiempo con fuego encendido; no sumamos duraciones escritas en texto.</p>}
    {!c.fuelRate && <p><a href={estimate.sourceUrl} target="_blank" rel="noreferrer">Datos Weber usados como base · los ajustes son de Lumbre</a></p>}
  </section>;
}
