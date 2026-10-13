// Public laboratory: user-entered grams only. Never ship internal formulation ratios.
export type LabDraft = { baseId: string; amounts: Record<string, number>; unit?: "g"; heat?: "directo" | "indirecto"; referencePolicy?: "user-v1" | "manual-v1" };
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
// Legacy style IDs validate existing saved records only; they contain no recipe weights.
export const tasteAxes = ["salado", "dulce", "acido", "amargo", "umami"];
export function relativeProfile(profile: ReturnType<typeof weightedProfile>) {
  const maximum = Math.max(0, ...profile.map(row => row.value ?? 0));
  return profile.map(row => ({ ...row, value: row.value === null ? null : maximum > 0 ? row.value / maximum : 0 }));
}
export type LabSelection = { ids: string[]; amounts: Record<string, number> };
export function toggleLabSelection(current: LabSelection, id: string, catalog: LabIngredient[], _style: string): LabSelection {
  if (!catalog.some(item => item.id === id) || (!current.ids.includes(id) && current.ids.length >= 12)) return current;
  const ids = current.ids.includes(id) ? current.ids.filter(value => value !== id) : [...current.ids, id];
  return { ids, amounts: Object.fromEntries(ids.map(key => [key, key === id ? NaN : current.amounts[key]])) };
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
