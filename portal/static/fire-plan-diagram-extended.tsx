import { useId } from "react";
import { type Configuration, equipmentLabels, surfaceLabels } from "./fire-plan-model";
import { Coals, Food, Marker } from "./fire-plan-diagram";

export default function ExtendedDiagram({ c }: { c: Configuration }) {
  const id = useId().replace(/:/g, "");
  const open = c.equipment === "abierta", kamado = c.equipment === "kamado";
  const indirect = c.cookingStyle === "indirecto", combined = c.cookingStyle === "dos_zonas";
  const conditional = !open && !kamado && !indirect;
  const labels = open ? ["Brasas bajo la zona de cocción directa.", "Alimento sobre el soporte elegido.", "Zona sin brasas para retirar; no es un horno indirecto."]
    : ["Combustible en el hogar inferior.", indirect ? (kamado ? "Deflector entre las brasas y el alimento." : "Separador del modelo entre fuego y alimento.") : combined && kamado ? "Deflector parcial: sólo con accesorios compatibles." : "Paso directo del calor: montaje sujeto al manual.", "Alimento sobre su soporte, separado del combustible."];
  return <figure className="fire-diagram fire-diagram-technical" data-equipment={c.equipment} data-method={c.cookingStyle}>
    <div className="fire-diagram-heading"><span>MONTAJE / CORTE ESQUEMÁTICO</span><strong>{equipmentLabels[c.equipment]}</strong></div>
    <svg viewBox={open ? "45 105 390 200" : "100 10 280 295"} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>{equipmentLabels[c.equipment]} · {c.cookingStyle} · {surfaceLabels[c.surface]}</title>
      <desc id={`${id}-desc`}>{labels.join(" ")} Rojo y flechas: calor conceptual, no una medición. {open ? "Equipo sin tapa." : "Corte que muestra el interior, no una instrucción para cocinar abierto."}</desc>
      <defs><marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#7b251b" strokeWidth="1.5"/></marker><pattern id={`${id}-wall`} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#bbb"/></pattern></defs>
      <g fill="none" stroke="#111" strokeWidth="2">
        <path d="M30 291H450" stroke="#ccc"/>
        {open ? <>
          <path d="M65 171H411V234H65Z" fill="white"/><path d="M58 167H418M76 172V181M96 172V181M116 172V181M136 172V181M156 172V181M176 172V181M196 172V181M216 172V181M236 172V181M256 172V181M276 172V181M296 172V181M316 172V181M336 172V181M356 172V181M376 172V181M396 172V181M82 234V289M392 234V289M82 275H392"/>
          <Coals x={152} y={218} wood={c.fuelType === "lena"}/><Food x={152} y={165} surface={c.surface}/>
          <path d="M246 185V228" strokeDasharray="4 4" stroke="#666"/>
          <path d="M151 200V175" stroke="#7b251b" strokeWidth="3" markerEnd={`url(#${id}-arrow)`}/>
          <path d="M279 212H365" stroke="#666" strokeDasharray="4 4"/>
          <Marker x={100} y={211} n={1}/><Marker x={205} y={139} n={2}/><Marker x={336} y={192} n={3}/>
        </> : <>
          {kamado ? <><path d="M239 40C155 40 119 113 127 181Q128 263 240 269Q351 263 353 181C361 113 324 40 239 40Z" fill={`url(#${id}-wall)`}/><path d="M240 52C164 52 133 117 139 178Q142 251 240 256Q338 251 341 178C347 117 316 52 240 52Z" fill="white"/><path d="M124 153H356M214 40V26H266V40M212 26H268M165 258L150 288M315 258L330 288M150 282H330M221 266V255H259V266"/></>
            : <><path d="M142 250V83Q142 40 240 40Q338 40 338 83V250Q240 280 142 250Z" fill="white"/><path d="M142 91H338M142 244H338M214 40V26H266V40M155 258L146 290M324 258L334 290M166 87H313M171 92H309"/><rect x="302" y="190" width="22" height="44" rx="4"/><path d="M309 206V215"/></>}
          <path d="M155 149H324M171 239H310" stroke="#666"/>
          <Coals x={240} y={232} wood={c.fuelType === "lena"}/>
          <Food x={combined && kamado ? 282 : 240} y={146} surface={c.surface}/>
          {combined && kamado && <Food x={186} y={146} surface={c.surface}/>}
          {(indirect || (combined && kamado)) && <path data-separator="true" d={combined ? "M245 185H315" : "M175 185H306"} strokeWidth="7"/>}
          <path d={indirect ? "M193 218C158 209 159 123 194 105M287 218C323 209 322 123 289 105" : combined && kamado ? "M205 215L191 168M290 216C330 209 330 117 309 111" : "M232 213V167M251 213V167"} stroke="#7b251b" strokeWidth="3" markerEnd={`url(#${id}-arrow)`}/>
          <Marker x={170} y={229} n={1}/><Marker x={337} y={185} n={2}/><Marker x={322} y={126} n={3}/>
          {conditional && <path d="M365 101V233" stroke="#666" strokeDasharray="4 4"/>}
        </>}
      </g>
    </svg>
    <ol className="fire-diagram-key">{labels.map((text,i)=><li key={text}><b>{i+1}</b><span>{text}</span></li>)}</ol>
    <figcaption><strong>Soporte: {surfaceLabels[c.surface]}.</strong> {c.surface === "sin_definir" && "Alimento y accesorio sin representar hasta confirmar el soporte. "}{open ? "La zona de retirada no mantiene una temperatura segura por sí sola. " : "Equipo mostrado en corte; geometría, alturas y separador dependen del fabricante. "}{kamado && combined && "Las piezas indican posiciones posibles, no cantidades ni una secuencia. No manipules cerámica caliente para seguir el dibujo. "}{conditional && "No se presupone que retirar un separador sea válido: usa sólo el montaje directo autorizado. En combinado, consulta por separado cada etapa; este dibujo sólo muestra el principio directo. "}Rojo + flechas: calor, no temperatura ni flujo medido. Confirma el montaje en el manual.</figcaption>
  </figure>;
}
