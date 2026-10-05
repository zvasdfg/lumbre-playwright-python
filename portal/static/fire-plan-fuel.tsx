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
  return { initial, additions, indirect, charcoalKg: indirect ? [.6, .6, .84][index] : [.56, .98, 2.24][index], directOnly: c.cookingStyle !== "directo" && !indirect };
}
export default function FuelEstimate({ c }: { c: Configuration }) {
  const estimate = estimateFuel(c);
  const kettle = kettleFuelReference(c);
  if ("reason" in estimate && kettle) return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible">
    <span>REFERENCIA KETTLE · {c.kettleDiameter} CM · CONFIRMA EL TAMAÑO</span>
    <h3>{c.fuelType === "briquetas" ? kettle.initial + " briquetas Weber" : kettle.charcoalKg + " kg de carbón de haya"}</h3>
    <p>Carga de referencia {kettle.indirect ? "para la primera hora en indirecto, sumando ambos lados" : "para montaje directo"}. No es el consumo total de la sesión ni una carga universal para todos los carbones.</p>
    {c.fuelType === "briquetas" && kettle.additions !== null ? <p><strong>Prepara {kettle.initial + kettle.additions} briquetas para {c.durationHours} h, más {Math.ceil((kettle.initial + kettle.additions) * .25)} de reserva (margen de planificación del 25%).</strong> La reserva por duración usa la tabla de briquetas Weber del manual: 4 por lado y hora adicional en 47/57 cm; 6 en 67 cm. Las fracciones se presupuestan como hora completa. No se convierte a kg porque el peso por briqueta varía. El encendido forma parte de la preparación de esa carga; no se suma otra carga por el margen de precalentamiento.</p> : <p>Se muestra la carga inicial; no hay un total automático en kg respaldado para toda la sesión. {c.fuelType === "carbon" ? "La equivalencia en kg publicada es para carbón de haya; no se traslada directamente a mezquite, encino ni leña. El manual expresa las recargas en puñados, sin peso verificable." : "La tabla de directo no publica una tasa de recarga por hora; no la inventamos."}</p>}
    {kettle.directOnly && <p>Tu plan incluye ahumado o varias zonas/etapas: esta cifra sólo compara la carga del montaje directo; no define la carga de tu secuencia.</p>}
    <p>La leña aromática se anota por separado y no se descuenta del carbón. No sustituye automáticamente el combustible principal. Para quemar leños, verifica la autorización del modelo.</p>
    <a href="https://www.weber.com/on/demandware.static/-/Sites-master-catalog/default/dwfb3a6638/documents/50b1bdb6-f0fe-409d-b9b3-50f312950392.pdf" target="_blank" rel="noreferrer">Weber: tabla de cargas, página 8 · referencia, no calibración de tu equipo</a>
  </section>;
  if ("reason" in estimate) return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible"><h3>¿Cuánto combustible necesito?</h3><p>{estimate.reason}</p></section>;
  const fmt = (n: number) => n.toLocaleString("es-MX", { maximumFractionDigits: 1 });
  return <section className="fire-fuel-estimate" aria-label="Cantidad de combustible">
    <span>COMBUSTIBLE PARA PREVER · ESTIMACIÓN</span>
    <h3>{fmt(estimate.total)} {estimate.unit} de {fuelLabels[c.fuelType]}</h3>
    <p>Presupuesto total con 25% de margen. No es una carga que debas encender de una vez.</p>
    <dl className="fire-plan-facts"><div><dt>Consumo calculado</dt><dd>{fmt(estimate.low)}{estimate.high !== estimate.low ? "–" + fmt(estimate.high) : ""} {estimate.unit}</dd></div><div><dt>Reserva incluida</dt><dd>{fmt(estimate.reserve)} {estimate.unit}</dd></div></dl>
    <p>{estimate.source} Incluye {fmt(estimate.hours)} h de cocción + {fmt(estimate.preheat * 60)} min de precalentamiento presupuestado{estimate.startup ? " + " + fmt(estimate.startup) + " " + estimate.unit + " de arranque adicional" : ""}.</p>
    <small>Modelo de presupuesto v1: consumo horario × tiempo total + arranque adicional; después, reserva del 25%. Consumo y reserva se redondean hacia arriba a 0.1 y se suman. El margen es una decisión de planificación, no una garantía. Clima, tamaño, aperturas y combustible pueden cambiar el consumo. No incluye madera aromática. Carga, capacidad y recargas: sigue el manual.</small>
    {c.stages.length > 0 && <p>Las horas generales deben cubrir todo el tiempo con fuego encendido, incluidas pausas si mantienes el equipo encendido. No sumamos duraciones escritas en texto; usa una tasa medida representativa de toda la secuencia.</p>}
    {!c.fuelRate && <p><a href={fuelSources.pellets} target="_blank" rel="noreferrer">Referencia del fabricante y alcance</a></p>}
  </section>;
}
