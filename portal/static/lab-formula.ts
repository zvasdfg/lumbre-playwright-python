// Volumes remain volumes: the sources do not provide ingredient-specific gram weights.
export const labBases = [
  {
    id: "salt-pepper", name: "Sal y pimienta · base sencilla",
    source: "https://www.weber.com/US/en/recipes/red-meat/reverse-seared-rib-eye-steaks/weber-1634805.html",
    note: "Proporción de los ingredientes secos del ribeye de Weber. Cambiar el alimento o añadir ingredientes es una adaptación pendiente de probar.",
    amounts: { sal_kosher: 2, pimienta_negra: 1.5 } as Record<string, number>,
  },
  {
    id: "sweet-bbq", name: "BBQ dulce · adaptación inicial",
    source: "https://www.weber.com/CA/en/blog/tips-techniques/making-your-own-bbq-rub/weber-30952.html",
    note: "Adaptación del rub de Weber: sin cayena, con cebolla granulada y sal kosher del catálogo. No equivale a la receta original ni está validada por Lumbre.",
    amounts: { sal_kosher: 3, pimienta_negra: 3, ajo_granulado: 3, cebolla_granulada: 3, azucar_morena: 12, paprika_dulce: 3, pimienta_blanca: 1, comino: 1 } as Record<string, number>,
  },
];

export type LabDraft = { baseId: string; amounts: Record<string, number>; unit?: "g"; heat?: "directo" | "indirecto"; referencePolicy?: "user-v1" };
export function validAmounts(ids: string[], amounts: unknown, unit?: "g"): amounts is Record<string, number> {
  if (!amounts || typeof amounts !== "object" || Array.isArray(amounts)) return false;
  const entries = Object.entries(amounts);
  return ids.length >= 2 && ids.length <= 12 && new Set(ids).size === ids.length &&
    entries.length === ids.length && entries.every(([id, value]) => ids.includes(id) &&
      typeof value === "number" && Number.isFinite(value) && value > 0 && value <= (unit === "g" ? 150 : 100)) &&
    (unit !== "g" || entries.reduce((sum, [, value]) => sum + Number(value), 0) <= 150.001);
}
export function formulaSignature(objective: string, draft: LabDraft) {
  return `SESSION:V2:${objective}:${draft.baseId}:${draft.unit ?? "tsp"}:${draft.heat ?? "legacy"}:${draft.referencePolicy ?? "legacy"}:${JSON.stringify(Object.entries(draft.amounts).sort(([a], [b]) => a.localeCompare(b)))}`;
}

export type LabIngredient = { id: string; familia: string; perfil_sensorial: Record<string, number | null> };
export const styles = [
  { id: "salt-pepper", name: "Salado simple", heats: ["directo", "indirecto"], ids: ["sal_kosher", "pimienta_negra", "ajo_granulado"] },
  { id: "sweet-bbq", name: "BBQ dulce", heats: ["indirecto"], ids: ["sal_kosher", "pimienta_negra", "ajo_granulado", "cebolla_granulada", "azucar_morena", "paprika_dulce"] },
  { id: "beef-bark", name: "Bark para res", heats: ["indirecto"], ids: ["pimienta_negra", "ajo_granulado", "cebolla_granulada", "mostaza_polvo", "chile_ancho"] },
  { id: "manual", name: "Fórmula propia", heats: ["directo", "indirecto"], ids: [] as string[] },
];
labBases.push({ id: "beef-bark", name: "Bark para res", source: "https://amazingribs.com/tested-recipes/spice-rubs-and-pastes/big-bad-beef-rub-recipe/", note: "Inspiración: rub de res de Meathead, con protagonismo de pimienta y sal aplicada por separado. La fórmula por peso de Lumbre es una adaptación estimada, no la receta original.", amounts: {} });
labBases.push({ id: "manual", name: "Fórmula propia", source: "https://amazingribs.com/tested-recipes/spice-rubs-and-pastes/science-of-rubs/", note: "Cantidades definidas por el usuario. Sin preset ni validación de proporciones.", amounts: {} });

// Product-design starting percentages, NOT source volume-to-mass conversions or tested recipes.
const familyWeights: Record<string, Record<string, number>> = {
  "salt-pepper": { Sal: 40, Pimienta: 35, Allium: 25, Endulzante: 2, Chile: 10 },
  "sweet-bbq": { Sal: 18, Pimienta: 8, Allium: 18, Endulzante: 38, Chile: 18 },
  "beef-bark": { Sal: 15, Pimienta: 45, Allium: 25, Chile: 20, Semilla_aromatica: 10, Endulzante: 3 },
};
export function balance150(items: LabIngredient[], style: string): Record<string, number> {
  if (items.length < 2 || items.length > 12 || !familyWeights[style]) return {};
  const counts = Object.fromEntries(items.map(item => [item.familia, items.filter(other => other.familia === item.familia).length]));
  const caps: Record<string, number> = { Sal: 1, Pimienta: .7, Allium: .45, Endulzante: .6, Chile: .5, Hierba: .06, Semilla_aromatica: .1, Citrico: .08, Especia_calida: .02, Umami: .15, Tostado: .1 };
  const rows = items.map(item => {
    const hot = (item.perfil_sensorial.picante ?? 0) >= 4 && item.familia === "Chile";
    return { id: item.id, weight: hot ? 1 : (familyWeights[style][item.familia] ?? 2) / counts[item.familia], cap: Math.floor(15000 * (hot ? .02 : (caps[item.familia] ?? .02) / counts[item.familia])), amount: 0 };
  });
  if (rows.reduce((sum, row) => sum + row.cap, 0) < 15000) return {};
  let remaining = 15000;
  // Allocate hundredths of a gram with capped proportional shares; deterministic and exact total.
  while (remaining > 0) {
    const active = rows.filter(row => row.amount < row.cap);
    const total = active.reduce((sum, row) => sum + row.weight, 0);
    const budget = remaining;
    for (const row of active) {
      const share = Math.min(remaining, row.cap - row.amount, Math.max(1, Math.floor(budget * row.weight / total)));
      row.amount += share; remaining -= share;
    }
  }
  return Object.fromEntries(rows.map(row => [row.id, row.amount / 100]));
}
export const tasteAxes = ["salado", "dulce", "acido", "amargo", "umami"];
export function relativeProfile(profile: ReturnType<typeof weightedProfile>) {
  const maximum = Math.max(0, ...profile.map(row => row.value ?? 0));
  return profile.map(row => ({ ...row, value: row.value === null ? null : maximum > 0 ? row.value / maximum : 0 }));
}
export type LabSelection = { ids: string[]; amounts: Record<string, number> };
export function toggleLabSelection(current: LabSelection, id: string, catalog: LabIngredient[], style: string): LabSelection {
  if (!catalog.some(item => item.id === id) || (!current.ids.includes(id) && current.ids.length >= 12)) return current;
  const ids = current.ids.includes(id) ? current.ids.filter(value => value !== id) : [...current.ids, id];
  if (style === "manual") return { ids, amounts: Object.fromEntries(ids.map(key => [key, key === id ? NaN : current.amounts[key]])) };
  return { ids, amounts: balance150(catalog.filter(item => ids.includes(item.id)), style) };
}
export function weightedProfile(items: LabIngredient[], amounts: Record<string, number>) {
  const total = items.reduce((sum, item) => sum + (Number.isFinite(amounts[item.id]) && amounts[item.id] > 0 ? amounts[item.id] : 0), 0);
  return tasteAxes.map(axis => {
    let covered = 0, weighted = 0;
    for (const item of items) {
      const value = item.perfil_sensorial[axis], grams = amounts[item.id];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 5 && Number.isFinite(grams) && grams > 0) { covered += grams; weighted += value * grams; }
    }
    return { axis, value: total > 0 && Math.abs(covered - total) < .001 ? weighted / total : null, coverage: total ? covered / total : 0 };
  });
}
export const familyGuidance: Record<string, string> = {
  Sal: "Empieza por la sal. Si el alimento ya está salado, puedes retirarla de la mezcla.",
  Pimienta: "Revisa la pimienta de tu base; puedes cambiarla por otra variedad.",
  Allium: "Ajo y cebolla: conserva la base o elige una variación.",
  Endulzante: "El dulzor es opcional. La base sencilla no lo necesita.",
  Chile: "Elige el carácter del chile; no todos aportan el mismo picor.",
  Hierba: "Añade un acento herbal si lo buscas; no necesitas completar esta familia.",
  Semilla_aromatica: "Comino, cilantro, mostaza y otras semillas. Explora un acento a la vez.",
  Citrico: "Un giro cítrico opcional, no un requisito de la fórmula.",
  Especia_calida: "Canela, clavo, jengibre y más. Prueba un solo cambio para poder compararlo.",
  Umami: "Hongos o levadura nutricional: una variación opcional para explorar.",
  Tostado: "Café y cacao: registra cómo cambian el resultado después de cocinar.",
};
