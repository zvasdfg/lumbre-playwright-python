import { type Configuration, equipmentLabels, methodLabels, surfaceLabels, fuelLabels } from "./fire-plan-model";

const descriptions: Record<string, string> = {
  kettle: "Comparación en corte: directo con brasas bajo el alimento; indirecto con brasas laterales y centro libre. Vistas en planta y guías de construcción.",
  gas: "Comparación en corte: quemadores activos bajo el alimento en directo; alimento sobre el quemador apagado en indirecto. No utiliza carbón.",
  kamado: "Kamado cerámico en corte: directo sin deflector e indirecto con deflector entre brasas y alimento. El calor indirecto pasa por los bordes del deflector.",
  abierta: "Parrilla sin tapa: brasas bajo la zona de cocción y una zona sin brasas para retirar el alimento. La zona libre no funciona como horno.",
  ahumador: "Ahumador vertical de carbón: hogar inferior, separador intermedio y alimento en la rejilla superior. Montaje indirecto conceptual.",
  offset: "Ahumador offset de flujo convencional: fuego en caja lateral, alimento en cámara separada y salida por la chimenea opuesta.",
  pellets: "Sistema de pellets: tolva, sinfín y quemador bajo el difusor; alimento sobre la rejilla. Montaje indirecto conceptual, no apertura de llama directa.",
};

export default function FirePlanIllustration({ c }: { c: Configuration }) {
  const comparison = ["kettle", "gas", "kamado"].includes(c.equipment);
  const conditional = ["ahumador", "offset", "pellets"].includes(c.equipment) && c.cookingStyle !== "indirecto";
  const src = `/editorial/planner/r001/${c.equipment}.jpg`;
  const selection = conditional
    ? "Referencia del equipo: la imagen muestra sólo su montaje indirecto. Tu montaje directo requiere el manual específico."
    : comparison
      ? c.cookingStyle === "directo" ? "Tu método: vista izquierda · calor directo." : c.cookingStyle === "indirecto" ? "Tu método: vista derecha · calor indirecto." : "Tu plan combina directo e indirecto. Las vistas comparan principios; no representan dos zonas simultáneas ni una secuencia obligatoria."
      : c.equipment === "abierta" ? "Tu montaje: cocción directa y zona de retirada, sin función de horno." : "Tu montaje: calor indirecto, con tapa.";
  return <figure className="fire-diagram fire-diagram-technical fire-diagram-illustrated" data-equipment={c.equipment} data-method={c.cookingStyle}>
    <div className="fire-diagram-heading"><span>APUNTE DE INGENIERÍA / ESQUEMA CONCEPTUAL</span><strong>{equipmentLabels[c.equipment]} · {methodLabels[c.cookingStyle]}</strong></div>
    <p className={conditional ? "fire-plan-caution" : "fire-diagram-selection"}>{selection}</p>
    <a className="fire-diagram-image-link" href={src} target="_blank" rel="noreferrer" aria-label={`Ampliar ilustración de ${equipmentLabels[c.equipment]}`}><img src={src} width="1536" height="1024" alt={descriptions[c.equipment]} loading="eager" /></a>
    <a className="fire-diagram-enlarge" href={src} target="_blank" rel="noreferrer">Ampliar dibujo ↗</a>
    <figcaption><strong>Combustible elegido: {fuelLabels[c.fuelType]}. Soporte: {surfaceLabels[c.surface]}.</strong> La ilustración representa el principio del equipo con rejilla; no reproduce cada accesorio, alimento ni combustible seleccionado. {c.fuelType === "lena" && "El carbón dibujado no equivale a una carga de leña: usa sólo la carga y presentación autorizadas. "}{conditional && "No retires deflectores ni improvises una zona directa para imitar la imagen. "}Trazos rojos: representación conceptual del fuego y calor, no intensidad, temperatura ni cantidad de combustible. Geometría y montaje sujetos al manual del fabricante.</figcaption>
  </figure>;
}
