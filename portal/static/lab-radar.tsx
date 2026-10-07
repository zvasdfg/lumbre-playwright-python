import { useId } from "react";
import { weightedProfile, relativeProfile, type LabIngredient } from "./lab-formula";
export default function LabRadar({ items, amounts }: { items: LabIngredient[]; amounts: Record<string, number> }) {
  const id = useId();
  const profile = relativeProfile(weightedProfile(items, amounts));
  const names = ["Salado", "Dulce", "Ácido", "Amargo", "Umami"];
  const point = (i: number, radius: number) => [200 + Math.cos(-Math.PI / 2 + i * Math.PI * 2 / 5) * radius, 180 + Math.sin(-Math.PI / 2 + i * Math.PI * 2 / 5) * radius];
  const polygon = (values: number[]) => values.map((value, i) => point(i, value * 120).join(",")).join(" ");
  const complete = profile.every(row => row.value !== null);
  return <section className="lab-radar">
    <h4>Balance relativo de tu mezcla</h4>
    <p>Estimación orientativa · perfiles de ingredientes pendientes de validación sensorial.</p>
    <p>Solo cinco sabores: cada ingrediente suma según sus gramos. Las notas cítricas, herbales, tostadas y el picor no se convierten automáticamente en ácido, dulce, amargo o umami.</p>
    <svg viewBox="0 0 400 360" role="img" aria-labelledby={id}>
      <title id={id}>Radar relativo al sabor dominante de esta mezcla: {profile.map((row, i) => `${names[i]} ${row.value === null ? "sin datos completos" : Math.round(row.value * 100) + "% del máximo"}`).join(", ")}</title>
      {[.2, .4, .6, .8, 1].map(level => <polygon key={level} points={polygon(Array(5).fill(level))} fill="none" stroke="#a49f93" strokeWidth=".7" />)}
      {names.map((name, i) => { const edge = point(i, 120), label = point(i, 158); return <g key={name}><line x1="200" y1="180" x2={edge[0]} y2={edge[1]} stroke="#a49f93" strokeWidth=".7" /><text x={label[0]} y={label[1]} textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontSize="14">{name}</text></g>; })}
      {complete && <polygon points={polygon(profile.map(row => row.value!))} fill="#ba302733" stroke="#ba3027" strokeWidth="2" />}
      {profile.map((row, i) => { const p = point(i, (row.value ?? 0) * 120); return row.value === null ? null : <circle key={row.axis} cx={p[0]} cy={p[1]} r="3" fill="#ba3027" />; })}
    </svg>
    <p>{profile.map((row, i) => `${names[i]}: ${row.value === null ? "dato incompleto" : Math.round(row.value * 100) + "%"}`).join(" · ")}</p>
    <small>El sabor de mayor puntuación en esta fórmula marca el borde (100%); los demás se muestran en proporción. Son valores del catálogo ponderados por gramos, no porcentajes de ingredientes ni intensidad absoluta comparable entre mezclas. No predice de forma validada la percepción después de cocinar. El picor no es uno de los cinco sabores.{!complete && " Referencia parcial: faltan datos y no se cierra el radar."}{complete && profile.every(row => row.value === 0) && " Todos los valores son cero: no hay un sabor dominante calculado."}</small>
  </section>;
}
