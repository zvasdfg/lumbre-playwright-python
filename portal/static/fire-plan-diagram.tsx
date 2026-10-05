import { useId } from "react";
import { type Configuration, equipmentLabels, surfaceLabels } from "./fire-plan-model";

const ember = "#7b251b";
export function Marker({ x, y, n }: { x: number; y: number; n: number }) {
  return <g transform={`translate(${x} ${y})`}><circle r="13" fill="white" stroke="#111"/><text textAnchor="middle" y="4" fontSize="12" fill="#111">{n}</text></g>;
}
export function Food({ x, y, surface }: { x: number; y: number; surface: Configuration["surface"] }) {
  return <g transform={`translate(${x} ${y})`} data-diagram-surface={surface}>
    {surface !== "sin_definir" && <><path d="M-24 -15C-30 -32 -7 -38 5 -30C17 -36 32 -22 24 -13C13 -5 -12 -5 -24 -15Z" fill="#eee" stroke="#111" strokeWidth="2"/><path d="M-17 -24L-2 -13M-6 -29L10 -15M7 -28L21 -18" stroke="#666"/></>}
    {surface === "rejilla" ? <path d="M-38 0H38M-32 -3V4M-20 -3V4M-8 -3V4M4 -3V4M16 -3V4M28 -3V4" stroke="#111" strokeWidth="2"/>
      : surface === "plancha" ? <rect x="-40" y="-4" width="80" height="6" fill="#111"/>
      : surface === "sarten" ? <path d="M-32 -9L-26 2H27L33 -9M32 -5H52" fill="white" stroke="#111" strokeWidth="3"/>
      : surface === "bandeja" ? <path d="M-37 -10L-30 3H30L37 -10" fill="none" stroke="#111" strokeWidth="3"/>
      : <path d="M-35 0H35" stroke="#666" strokeDasharray="4 4"/>}
  </g>;
}
export function Coals({ x, y, wood }: { x: number; y: number; wood: boolean }) {
  return <g transform={`translate(${x} ${y})`} fill={ember} stroke={ember}>
    {wood ? <><path d="M-34 1L30 -9L35 2L-29 12Z"/><path d="M-30 -12L34 2L30 13L-34 -2Z"/><path d="M-22 -6L22 4" stroke="white"/></>
      : [-28, -9, 10, 29].map((dx, i) => <path key={dx} d={`M${dx-8} 0l4 -10 12 2 3 11 -11 5Z`} transform={`rotate(${i%2 ? 12 : -8} ${dx} 0)`}/>)}
  </g>;
}

/** Conceptual cutaways, not manufacturer assembly drawings or airflow predictions. */
export default function TechnicalDiagram({ c }: { c: Configuration }) {
  const id = useId().replace(/:/g, "");
  const gas = c.equipment === "gas", offset = c.equipment === "offset";
  const direct = c.cookingStyle === "directo", combined = c.cookingStyle === "dos_zonas";
  const foodX = direct ? 150 : offset ? 278 : 307;
  const labels = offset
    ? ["Combustible en la caja lateral.", "Alimento en la cámara, separado del fuego.", "Recorrido ilustrativo hacia la chimenea."]
    : [gas ? "Quemador encendido: zona de calor directo." : "Brasas a un lado: zona de calor directo.", direct ? "Alimento sobre la zona activa." : combined ? "Dos zonas disponibles; el orden lo define tu receta." : gas ? "Alimento sobre quemador apagado." : "Alimento en el lado sin brasas debajo.", "Tapa cerrada durante la cocción indirecta."];
  return <figure className="fire-diagram fire-diagram-technical" data-equipment={c.equipment} data-method={c.cookingStyle}>
    <div className="fire-diagram-heading"><span>MONTAJE / CORTE ESQUEMÁTICO</span><strong>{equipmentLabels[c.equipment]}</strong></div>
    <svg viewBox="0 0 480 320" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>{equipmentLabels[c.equipment]} · {c.cookingStyle} · {surfaceLabels[c.surface]}</title>
      <desc id={`${id}-desc`}>{labels.join(" ")} Rojo y flechas continuas: calor. Trazo discontinuo: límite entre zonas, no barrera física. El corte permite ver el interior, no indica cocinar con la tapa abierta.</desc>
      <defs><marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke={ember} strokeWidth="1.5"/></marker><pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="#ddd" strokeWidth="1"/></pattern></defs>
      <path d="M25 286H455" stroke="#ccc"/>
      {offset ? <g stroke="#111" strokeWidth="2" fill="none">
        <path d="M150 110Q150 85 178 85H374Q403 85 403 115V212Q403 232 374 232H176Q150 232 150 208Z" fill={`url(#${id}-hatch)`}/>
        <path d="M150 143H403M155 178H398M191 93H229M191 98H229M183 232L174 276M368 232L379 276M174 263H379"/>
        <circle cx="179" cy="279" r="10" fill="white"/><circle cx="377" cy="279" r="10" fill="white"/>
        <path d="M43 174Q43 166 53 166H132V239H53Q43 239 43 229Z" fill="white"/><path d="M132 190H150V215H132M49 221H125M62 187V203M68 187V203M74 187V203M83 239V282"/>
        <path d="M365 85V35H385V85M360 35H390" fill="white"/><circle cx="281" cy="108" r="9" fill="white"/><path d="M281 108L285 102"/>
        <Coals x={86} y={214} wood={c.fuelType === "lena"}/><Food x={278} y={177} surface={c.surface}/>
        <path d="M115 201C168 201 175 121 225 122M236 122C293 128 356 150 375 63" stroke={ember} strokeWidth="3" markerEnd={`url(#${id}-arrow)`}/>
        <Marker x={37} y={151} n={1}/><Marker x={310} y={151} n={2}/><Marker x={410} y={51} n={3}/>
      </g> : <g stroke="#111" strokeWidth="2" fill="none">
        {gas ? <><path d="M83 180V105Q83 68 118 68H357Q394 68 394 105V180Z" fill={`url(#${id}-hatch)`}/><path d="M80 180H398L384 239H94Z" fill="white"/><path d="M95 240V283M383 240V283M95 273H383M45 180H80M398 180H433M213 90H268"/><rect x="182" y="244" width="114" height="20" rx="3" fill="white"/><circle cx="211" cy="254" r="5" fill={ember}/><circle cx="267" cy="254" r="5"/><path d="M116 222H187" stroke={ember} strokeWidth="6"/><path d="M278 222H346" stroke="#666" strokeWidth="4"/>{[130,153,176].map(x=><path key={x} d={`M${x} 214q-8 -9 0 -17q8 8 0 17Z`} fill={ember} stroke={ember}/>)}</>
          : <><path d="M80 180Q84 73 230 70Q376 73 390 180Z" fill={`url(#${id}-hatch)`}/><path d="M80 180Q103 257 235 257Q364 257 390 180Z" fill="white"/><path d="M80 180H390M214 70V57H255V70M153 245L124 281M316 245L345 281M220 257V278H250V257M200 284H270M275 85H300M275 90H300"/><circle cx="126" cy="280" r="10" fill="white"/><circle cx="344" cy="280" r="10" fill="white"/><path d="M110 223H350" stroke="#666"/><Coals x={153} y={218} wood={c.fuelType === "lena"}/></>}
        <path d="M98 181H375M235 184V239" stroke="#666" strokeDasharray="4 4"/>
        <Food x={foodX} y={177} surface={c.surface}/>
        {combined && <Food x={150} y={177} surface={c.surface}/>}
        <path d={direct ? "M149 201V184" : "M119 165C119 94 284 93 322 129"} stroke={ember} strokeWidth="3" markerEnd={`url(#${id}-arrow)`}/>
        {combined && <path d="M150 201V184" stroke={ember} strokeWidth="3" markerEnd={`url(#${id}-arrow)`}/>}
        <Marker x={100} y={215} n={1}/><Marker x={foodX+43} y={147} n={2}/><Marker x={369} y={83} n={3}/>
      </g>}
    </svg>
    <ol className="fire-diagram-key">{labels.map((label,i)=><li key={label}><b>{i+1}</b><span>{label}</span></li>)}</ol>
    <figcaption><strong>Soporte: {surfaceLabels[c.surface]}.</strong> {c.surface === "sin_definir" && "No se representa un alimento ni accesorio sin confirmar. "}{combined && "Las dos piezas indican posiciones posibles, no cantidades ni traslado automático. "}{offset ? "Offset convencional ilustrado; en flujo inverso cambia el recorrido. " : "Tapa dibujada en corte para mostrar el interior. "}Rojo + flechas: calor, no temperatura ni flujo medido. Confirma el montaje en el manual. {c.smoking && "El accesorio aromático depende del modelo y no se dibuja en una posición inventada."}</figcaption>
  </figure>;
}
