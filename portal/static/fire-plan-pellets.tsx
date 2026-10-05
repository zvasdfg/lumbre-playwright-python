import { useId } from "react";
import { type Configuration, surfaceLabels } from "./fire-plan-model";
import { Food, Marker } from "./fire-plan-diagram";

export default function PelletDiagram({ c }: { c: Configuration }) {
  const id = useId().replace(/:/g, "");
  const indirect = c.cookingStyle === "indirecto";
  const labels = ["Tolva: pellets para cocinar. Alimentación automática por sinfín.", "Quemador: el control dosifica combustible y aire; necesita electricidad.", indirect ? "Deflector y bandeja separan el alimento del quemador. Calor indirecto con tapa." : "Zona directa y montaje según el modelo. No se deducen de este corte indirecto."];
  return <figure className="fire-diagram fire-diagram-technical" data-equipment="pellets" data-method={c.cookingStyle}>
    <div className="fire-diagram-heading"><span>PELLETS / CORTE DEL SISTEMA</span><strong>{indirect ? "Calor indirecto" : "Sistema base + montaje por confirmar"}</strong></div>
    <svg viewBox="0 0 480 280" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>Asador de pellets · {surfaceLabels[c.surface]}</title>
      <desc id={`${id}-desc`}>{labels.join(" ")} Flechas rojas: recorrido conceptual del calor; no medición.</desc>
      <defs><marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#7b251b" strokeWidth="1.5"/></marker></defs>
      <g fill="none" stroke="#151515" strokeWidth="2">
        <path d="M15 255H458" stroke="#ccc"/>
        <path d="M145 190V91Q145 48 205 48H376Q423 48 423 91V190Q285 235 145 190Z" fill="white"/>
        <path d="M145 111H423M253 47V35H311V47M396 51V24H418V71M390 23H424M175 207L161 254M393 207L407 254"/>
        <path d="M25 80H115V173L88 205H57L25 173ZM19 80V71H121V80" fill="white"/>
        {[0,1,2].flatMap(row => [0,1,2,3].map(col => <path key={`${row}-${col}`} d={`M${38+col*18} ${103+row*13}l9 4`} strokeWidth="5" stroke="#7b251b"/>))}
        <rect x="39" y="143" width="58" height="26" rx="3"/><path d="M48 155H70M81 151V161"/>
        <path d="M77 194H273V207H77Z" fill="white"/>
        {[0,1,2,3,4,5,6,7].map(i => <path key={i} d={`M${95+i*21} 195l8 11`}/>)}
        <path d="M258 186L267 215H310L319 186Z" fill="white"/>
        <path d="M276 190Q263 178 282 160Q279 177 291 172Q306 181 297 194" stroke="#7b251b" strokeWidth="3"/>
        <path d="M196 158H382" strokeWidth="6"/><path d="M172 139L390 147" strokeWidth="4"/><path d="M164 113H407M176 109V117M198 109V117M220 109V117M242 109V117M264 109V117M286 109V117M308 109V117M330 109V117M352 109V117M374 109V117M396 109V117"/>
        {indirect && <Food x={285} y={109} surface={c.surface}/>}
        <path d="M252 184C174 198 155 151 183 91M325 184C409 198 416 152 387 90" stroke="#7b251b" strokeWidth="3" markerEnd={`url(#${id}-arrow)`}/>
        <circle cx="216" cy="222" r="12"/><path d="M209 215L223 229M223 215L209 229M56 207V235H31V224M28 220V227M35 220V227"/>
        <Marker x={120} y={111} n={1}/><Marker x={332} y={214} n={2}/><Marker x={432} y={143} n={3}/>
      </g>
    </svg>
    <ol className="fire-diagram-key">{labels.map((label, i) => <li key={label}><b>{i+1}</b><span>{label}</span></li>)}</ol>
    <figcaption><strong>Soporte: {surfaceLabels[c.surface]}.</strong> Corte conceptual del sistema indirecto; no es una instrucción para cocinar abierto. {!indirect && "No se dibuja la posición del alimento en directo: cambia por modelo. Subir la temperatura no equivale a exponerlo a la llama. "}No retires deflectores ni cambies piezas calientes para seguir el dibujo. Sigue el encendido y el ciclo de apagado del fabricante.</figcaption>
  </figure>;
}
