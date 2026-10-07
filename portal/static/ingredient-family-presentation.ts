const familyOrder = [
  "Sal", "Pimienta", "Allium", "Endulzante", "Chile", "Hierba",
  "Semilla_aromatica", "Citrico", "Especia_calida", "Umami", "Tostado",
];

export function orderIngredientFamilies(families: readonly string[]) {
  const rank = (family: string) => {
    const index = familyOrder.indexOf(family);
    return index < 0 ? familyOrder.length : index;
  };
  return [...families].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "es"));
}

export function familyLabel(family: string) {
  const labels: Record<string, string> = {
    Sal: "Sal",
    Pimienta: "Pimienta",
    Allium: "Ajo y cebolla",
    Endulzante: "Endulzantes",
    Chile: "Chiles",
    Hierba: "Hierbas",
    Semilla_aromatica: "Aromáticos",
    Citrico: "Cítricos",
    Especia_calida: "Canela, clavo y otras especias",
    Umami: "Umami",
    Tostado: "Tostados: café y cacao",
  };
  return labels[family] ?? family.replaceAll("_", " ");
}
