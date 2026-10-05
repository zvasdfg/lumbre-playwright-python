import type { Configuration } from "./fire-plan-model";
import { issues, fuelLabels } from "./fire-plan-model";

export const fuelSources = {
  pellets: "https://contact-emea.weber.com/hc/en-us/articles/360048814014-Pellet-Consumption-SmokeFire",

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
  if (!low && c.equipment === "pellets" && !c.stages.length) {
    const temperatures = c.temperature.split(/[-–]/).map(v => number(v.trim())).map(v => c.unit === "F" ? (v - 32) * 5 / 9 : v);
    const lo = Math.min(...temperatures), hi = Math.max(...temperatures);
    if (lo >= 95 && hi <= 150) { low = 0.5; high = 1; source = "Referencia Weber SmokeFire: 95–150 °C. No es una medición de tu modelo."; }
    else if (lo >= 230 && hi <= 315) { low = 1.5; high = 2; source = "Referencia Weber SmokeFire: 230–315 °C. No es una medición de tu modelo."; }
    else if (lo >= 95 && hi <= 315) { low = 0.5; high = 2; source = "Presupuesto amplio a partir de los extremos publicados por Weber SmokeFire (0.5–2 kg/h). Weber no publica una banda específica para esta temperatura intermedia: no es una interpolación ni una medición de tu modelo."; }
  }
  if (!low) return { unit, reason: "Sin referencia automática de Weber verificada para esta combinación. Puedes conservar la simulación sin cifra de consumo; los datos manuales quedan como ajuste opcional." };
  // Budget only: same hourly rate for the explicitly stated warm-up allowance.
  // 25% is a planning margin, not a statistical confidence interval.
  const rawLow = startup + low * (hours + preheat), rawHigh = startup + high * (hours + preheat);
  return { unit, low: up(rawLow), high: up(rawHigh), reserve: up(rawHigh * .25), total: up(up(rawHigh) + up(rawHigh * .25)), source, rateLow: low, rateHigh: high, preheat, startup, hours };
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
  if (kettle) return c.fuelType === "briquetas" && kettle.indirect
    ? { title: "Presupuesto por duración disponible", detail: c.durationHours ? `Prepara ${kettle.total} briquetas: ${kettle.initial} iniciales + ${kettle.additions} para recargas + ${kettle.reserve} de reserva.` : "Introduce las horas: calcularemos carga inicial, recargas y reserva en briquetas Weber." }
    : { title: "Sólo carga inicial disponible", detail: "Esta referencia no calcula todo el combustible de la sesión. Cambiar las horas no añade recargas." };
  const estimate = estimateFuel({ ...c, durationHours: c.durationHours || "1" });
  if (!("reason" in estimate)) return { title: c.fuelRate ? "Presupuesto con tu consumo medido" : "Rango de consumo disponible", detail: c.fuelRate ? "Tu dato manual sustituye la referencia automática. Puedes quitarlo en Ajustes de referencia." : "Referencia SmokeFire; el margen de reserva es de Lumbre. Verás el rango y un presupuesto conservador, no una medición exacta." };
  return { title: "Sin cálculo automático para este plan", detail: c.stages.length ? "Esta secuencia no tiene una referencia de consumo verificada. Puedes generar la guía, pero no incluirá una cantidad de combustible." : "Puedes generar la guía de montaje, pero esta combinación todavía no incluye una cantidad de combustible verificada." };
}
export function FuelAvailability({ c }: { c: Configuration }) {
  const availability = fuelAvailability(c);
  return <aside className="planner-fuel-availability" aria-label="Disponibilidad del cálculo de combustible" aria-live="polite"><strong>{availability.title}</strong><p>{availability.detail}</p></aside>;
}
export default function FuelEstimate({ c }: { c: Configuration }) {
  const estimate = estimateFuel(c);
  const kettle = kettleFuelReference(c);
  if ("reason" in estimate && kettle) return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible">
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
    <span>{c.fuelRate ? "ESTIMACIÓN CON TU CONSUMO" : "REFERENCIA WEBER · PRESUPUESTO LUMBRE"}</span>
    <h3>{fmt(estimate.low)}{estimate.high !== estimate.low ? "–" + fmt(estimate.high) : ""} {estimate.unit} de consumo estimado</h3>
    <p>{fuelLabels[c.fuelType]}. {estimate.rateHigh / estimate.rateLow >= 4 ? "Rango amplio: no hay una banda específica publicada para esta temperatura. " : ""}No es una medición de tu sesión.</p>
    <dl className="fire-plan-facts"><div><dt>Prepara · presupuesto conservador</dt><dd>{fmt(estimate.total)} {estimate.unit}</dd></div><div><dt>Reserva incluida · 25% del máximo</dt><dd>{fmt(estimate.reserve)} {estimate.unit}</dd></div></dl>
    <p>El presupuesto suma el extremo superior del rango y la reserva de Lumbre. No es una carga que debas encender de una vez.</p>
    <p>{estimate.source} Incluye {fmt(estimate.hours)} h de cocción + {fmt(estimate.preheat * 60)} min de precalentamiento presupuestado{estimate.startup ? " + " + fmt(estimate.startup) + " " + estimate.unit + " de arranque adicional" : ""}.</p>
    <details className="fuel-calculation-details"><summary>Cómo se calcula y qué incluye</summary><p>Consumo horario × tiempo total + arranque adicional; después, reserva del 25%. Consumo y reserva se redondean hacia arriba a 0.1 y se suman. El margen es una decisión de Lumbre, no una garantía de Weber. Clima, tamaño, aperturas y combustible pueden cambiar el consumo. No incluye madera aromática. Carga, capacidad y recargas: sigue el manual.</p></details>
    {c.stages.length > 0 && <p>Las horas generales deben cubrir todo el tiempo con fuego encendido, incluidas pausas si mantienes el equipo encendido. No sumamos duraciones escritas en texto; usa una tasa medida representativa de toda la secuencia.</p>}
    {!c.fuelRate && <p><a href={fuelSources.pellets} target="_blank" rel="noreferrer">Referencia del fabricante y alcance</a></p>}
  </section>;
}
