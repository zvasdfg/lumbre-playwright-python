// User-defined formulation references, separate from retired presets and production recipes.
// Percentages are by mass. These are not sensory validation or published production formulas.
export const userBlendReferences = [
  {
    id: "user-spg-v1",
    name: "Sal, pimienta y ajo",
    revision: 1,
    source: "Definido explícitamente por el usuario en este chat, 2026-10-07",
    basis: "mass-percent",
    ingredients: [
      { name: "Sal", percent: 45 },
      { name: "Pimienta", percent: 40 },
      { name: "Ajo", percent: 15 },
    ],
  },
  {
    id: "user-sp-v1",
    name: "Sal y pimienta",
    revision: 1,
    source: "Definido explícitamente por el usuario en este chat, 2026-10-07",
    basis: "mass-percent",
    ingredients: [
      { name: "Sal", percent: 50 },
      { name: "Pimienta", percent: 50 },
    ],
  },
  {
    id: "user-coffee-v1", name: "Minimalista con café · LMB-C-004", revision: 1,
    source: "Captura aportada por el usuario: codex-clipboard-2cd18481-08dc-4e7e-8966-c88125f547e5.png",
    basis: "mass-percent", ingredients: [{name: "Sal", percent: 45}, {name: "Pimienta", percent: 35}, {name: "Ajo", percent: 15}, {name: "Café", percent: 5}],
  },
  {
    id: "user-sweet-v1", name: "Dulce con chile · 006", revision: 1,
    source: "Captura aportada por el usuario: codex-clipboard-071bcb28-d123-43cd-b0ae-5a4ea4a8353b.png; azúcar blanca y chile ancho/pasilla/mulato",
    basis: "mass-percent", ingredients: [{name: "Sal", percent: 45}, {name: "Azúcar", percent: 25}, {name: "Pimienta", percent: 15}, {name: "Ajo", percent: 10}, {name: "Chile", percent: 5}],
  },
  {
    id: "user-spiced-v1", name: "Especiado · LMB-P-001 F1", revision: 1,
    source: "Captura aportada por el usuario: codex-clipboard-334f45ea-78a8-4a73-af9b-50287d87312d.png; chile pasilla",
    basis: "mass-percent", ingredients: [{name: "Sal", percent: 38}, {name: "Pimienta", percent: 15}, {name: "Ajo", percent: 15}, {name: "Comino", percent: 8}, {name: "Chile", percent: 16}, {name: "Sumac", percent: 8}],
  },
  {
    id: "user-shiitake-v1", name: "Res con shiitake · LMB-C-003 v01", revision: 1,
    source: "Etiqueta aportada por el usuario: codex-clipboard-796dadd7-8b34-4c7a-baa0-53a37405ad80.png; 18/05/25. No equiparar su código con el catálogo de producción actual.",
    basis: "mass-percent", ingredients: [{name: "Sal", percent: 65}, {name: "Pimienta", percent: 20}, {name: "Ajo", percent: 10}, {name: "Shiitake", percent: 5}],
  },
] as const;

type Item = {id: string; familia: string};
function role(item: Item): string {
  if (item.familia === "Sal") return "Sal";
  const roles: Record<string, string> = {pimienta_negra: "Pimienta", ajo_granulado: "Ajo", cebolla_granulada: "Ajo", cebolla_tostada: "Ajo", cafe_molido: "Café", azucar_morena: "Azúcar", chile_ancho: "Chile", chile_pasilla: "Chile", comino: "Comino", sumac: "Sumac", shiitake_seco: "Shiitake"};
  return roles[item.id] ?? item.id;
}

// Exact supplied reference first; adaptations preserve its salt share.
// Unknown accents share at most 10% (5% per accent) of the NON-salt allocation.
// This accent policy is an explicit UI estimate, not another supplied formula.
export function referenceFormula(items: Item[]) {
  const roles = [...new Set(items.map(role))];
  if (!roles.includes("Sal") || !roles.includes("Pimienta") || items.length > 12) return null;
  const ranked = userBlendReferences.map(reference => {
    const names = reference.ingredients.map(item => String(item.name));
    const shared = names.filter(name => roles.includes(name)).length;
    return {reference, score: shared / new Set([...names, ...roles]).size};
  }).sort((a, b) => b.score - a.score);
  const reference = ranked[0].reference;
  const weights: Record<string, number> = Object.fromEntries(reference.ingredients.map(item => [item.name, item.percent]));
  const salt = weights.Sal;
  const extras = roles.filter(name => name !== "Sal" && weights[name] === undefined);
  const accent = Math.min(10, extras.length * 5);
  const denominator = roles.filter(name => name !== "Sal").reduce((sum, name) => sum + (weights[name] ?? 0), 0);
  const percentages = items.map(item => {
    const name = role(item), count = items.filter(other => role(other) === name).length;
    const percent = name === "Sal" ? salt : weights[name] !== undefined ? weights[name] / denominator * (100 - salt - accent) : accent / extras.length;
    return {id: item.id, raw: percent / count * 150}; // hundredths of a gram for a 150 g batch
  });
  const cents = percentages.map(item => ({...item, cents: Math.floor(item.raw)}));
  let remainder = 15000 - cents.reduce((sum, item) => sum + item.cents, 0);
  const rounding = [...cents].sort((a,b) => (b.raw - b.cents) - (a.raw - a.cents) || a.id.localeCompare(b.id));
  for (const item of rounding) { if (remainder-- > 0) item.cents++; }
  const substituted = items.some(item => item.id === "azucar_morena" || item.id.startsWith("cebolla") || (item.familia === "Sal" && item.id !== "sal_mar_gruesa") || (reference.id === "user-spiced-v1" && item.id === "chile_ancho"));
  return { reference, adapted: ranked[0].score < 1 || substituted || items.length !== roles.length,
    amounts: Object.fromEntries(cents.map(item => [item.id, item.cents / 100])), saltPercent: salt };
}
