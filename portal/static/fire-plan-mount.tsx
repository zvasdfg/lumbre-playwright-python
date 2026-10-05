import { type Configuration, type Stage, surfaceLabels, surfaceGuidance, stageConfiguration, guide, methodLabels } from "./fire-plan-model";

export function Mount({ c }: { c: Configuration }) {
  const surface = c.surface;
  if (surface === "sin_definir") return <div className="fire-mount" data-surface={surface}><div><strong>{surfaceLabels[surface]}</strong><p>{surfaceGuidance(surface)}</p></div></div>;
  return <div className="fire-mount" data-surface={surface}>
    <svg viewBox="0 0 180 90" role="img" aria-label={"Alimento sobre " + surfaceLabels[surface]}>
      <ellipse cx="90" cy="32" rx="22" ry="9" fill="currentColor" />
      {surface === "sarten" || surface === "bandeja" ? <path d="M40 36L47 57H133L140 36 M140 41H160" fill="none" stroke="currentColor" strokeWidth="3" />
        : surface === "plancha" ? <path d="M35 48H145" stroke="currentColor" strokeWidth="7" />
        : <path d="M35 48H145 M45 43V54 M65 43V54 M85 43V54 M105 43V54 M125 43V54" stroke="currentColor" strokeWidth="2" />}
      <text x="90" y="80" textAnchor="middle" fill="currentColor" fontSize="11">{surfaceLabels[surface].toUpperCase()}</text>
    </svg>
    <div><strong>{surfaceLabels[surface]}</strong><p>{surfaceGuidance(surface)}</p><small>Detalle del soporte del alimento; la ubicación del fuego se muestra aparte.</small></div>
  </div>;
}

export function StageTimeline({ c, renderDiagram }: { c: Configuration; renderDiagram: (c: Configuration) => React.ReactNode }) {
  return <section className="fire-plan-timeline"><h3>Tu secuencia / datos de tu receta</h3>
    <p>Avanza al cumplir la duración o señal anotada. No se calculan tiempos ni se ejecutan cambios automáticamente.</p>
    <ol>{c.stages.map((s: Stage, i: number) => {
      const current = stageConfiguration(c, s);
      const previous = i ? c.stages[i - 1] : null;
      const changed = previous && s.kind !== "pausa" && (previous.kind === "pausa" || previous.method !== s.method || (previous.surface || c.surface) !== current.surface);
      return <li key={i} data-stage-kind={s.kind || "coccion"}>
        <strong>{String(i + 1).padStart(2, "0")} / {s.name}</strong>
        {s.kind === "pausa" ? <p>Fuera del fuego · sin objetivo de temperatura del asador. Sigue las condiciones de tiempo y conservación de tu receta; no implica apagar ni dejar desatendido el equipo.</p>
          : <><p>{methodLabels[s.method]} · {s.temperature ? s.temperature + " °" + c.unit : "Temperatura pendiente"}</p>
            <div className="fire-stage-layout">{renderDiagram(current)}<div><h4>{guide(current).layout}</h4><Mount c={current}/></div></div></>}
        <p><strong>Cuándo continuar:</strong> {s.duration || "Duración o señal pendiente de tu receta"}</p>
        {changed && <p className="fire-plan-caution">Cambio de montaje o regreso al fuego: comprueba el método y el soporte antes de continuar. Sigue el procedimiento del fabricante; este esquema no autoriza manipular piezas calientes ni trasladar brasas.</p>}
        {s.notes && <p className="preserve-lines">{s.notes}</p>}
      </li>;
    })}</ol>
  </section>;
}
