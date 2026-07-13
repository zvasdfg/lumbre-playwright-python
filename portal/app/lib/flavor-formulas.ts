import type { Ingredient } from "./ingredients";

export type FlavorRole =
  | "salinity"
  | "pepper"
  | "allium"
  | "toasted"
  | "smoke"
  | "sweetener"
  | "sweet_spice"
  | "herb"
  | "earthy"
  | "umami"
  | "citrus"
  | "chile";

export type FormulaEvidence = {
  level: "referenced" | "close" | "experimental";
  formula_id: string | null;
  formula_name: string;
  conclusion: string;
  matched_roles: string[];
  missing_roles: string[];
  additional_profiles: Array<{
    role: string;
    ingredients: string[];
    contribution: string;
  }>;
  sources: Array<{ title: string; url: string }>;
};

export type ExpectedProfile = {
  attribute: string;
  intensity: number;
  ingredients: string[];
};

type FormulaTemplate = {
  id: string;
  name: string;
  description: string;
  required: Partial<Record<FlavorRole, number>>;
  objectives?: string[];
  sources: Array<{ title: string; url: string }>;
};

const roleLabels: Record<FlavorRole, string> = {
  salinity: "base salina",
  pepper: "pimienta",
  allium: "ajo o cebolla",
  toasted: "tostado",
  smoke: "ahumado",
  sweetener: "endulzante",
  sweet_spice: "especia de aroma dulce",
  herb: "herbal",
  earthy: "terroso",
  umami: "umami",
  citrus: "cítrico",
  chile: "chile",
};

const contributionByRole: Record<FlavorRole, string> = {
  salinity: "refuerza la percepción general y el sazonado",
  pepper: "añade pungencia, aroma y textura de costra",
  allium: "añade profundidad sulfurada y notas sabrosas",
  toasted: "añade notas tostadas, color y profundidad de bark",
  smoke: "añade humo, color y carácter de cocción lenta",
  sweetener: "añade dulzor, color y potencial de caramelización",
  sweet_spice: "añade aroma cálido; no sustituye el dulzor de un azúcar",
  herb: "añade frescura resinosa o vegetal",
  earthy: "añade profundidad terrosa y especiada",
  umami: "añade intensidad sabrosa y persistencia",
  citrus: "añade elevación aromática y contraste cítrico",
  chile: "añade picor, color y notas de Capsicum",
};

export const formulaTemplates: FormulaTemplate[] = [
  {
    id: "classic_spg",
    name: "SPG clásico",
    description: "base salina + pimienta + ajo o cebolla",
    required: { salinity: 1, pepper: 1, allium: 1 },
    sources: [
      {
        title: "McCormick Butcher All Purpose: sea salt, garlic and black pepper",
        url: "https://www.mccormick.com/products/mccormick-grill-mates-cracked-pepper-garlic-sea-salt-seasoning-6-03-oz",
      },
      {
        title: "McCormick Signature Blend: sea salt, garlic, black pepper and celery seed",
        url: "https://www.mccormick.com/products/mccormick-grill-mates-signature-blend-seasoning-6-53-oz",
      },
    ],
  },
  {
    id: "peppercorn_medley",
    name: "Base salina con medley de pimientas",
    description: "base salina + al menos tres pimientas",
    required: { salinity: 1, pepper: 3 },
    objectives: ["Costra para res", "Bark para cocción lenta"],
    sources: [
      {
        title: "McCormick Peppercorn Medley: black, white, green and pink peppercorns",
        url: "https://www.mccormick.com/products/mccormick-peppercorn-medley-grinder-0-85-oz",
      },
      {
        title: "McCormick Coarse Black Pepper & Flake Salt seasoning",
        url: "https://www.mccormick.com/grill-mates/flavors/seasoning-blends/grill-mates-coarse-black-pepper-and-flake-salt-house-blend",
      },
    ],
  },
  {
    id: "pepper_toasted_steakhouse",
    name: "Pimienta y tostado estilo steakhouse",
    description: "base salina + pimienta + componente tostado",
    required: { salinity: 1, pepper: 1, toasted: 1 },
    objectives: ["Costra para res", "Bark para cocción lenta"],
    sources: [
      {
        title: "McCormick Cracked Peppercorn & Worcestershire: pepper, salt and toasted onion",
        url: "https://www.mccormick.com/products/mccormick-grill-mates-cracked-peppercorn-worcestershire-seasoning-2-75-oz",
      },
    ],
  },
  {
    id: "sweet_smoky_rub",
    name: "Rub dulce-ahumado",
    description: "base salina + endulzante + ahumado",
    required: { salinity: 1, sweetener: 1, smoke: 1 },
    objectives: ["Bark para cocción lenta", "Pollo al fuego directo"],
    sources: [
      {
        title: "McCormick Sweet & Smoky Rub: salt, sugar, chipotle, paprika, garlic and onion",
        url: "https://www.mccormick.com/products/mccormick-r-grill-mates-r-sweet-smoky-rub-5-37-oz",
      },
      {
        title: "McCormick Brown Sugar Bourbon: salt, brown sugar, garlic, onion and spices",
        url: "https://www.mccormick.com/products/mccormick-grill-mates-brown-sugar-bourbon-seasoning-3-oz",
      },
    ],
  },
  {
    id: "herbal_allium",
    name: "Base herbal con allium",
    description: "base salina + ajo o cebolla + hierbas",
    required: { salinity: 1, allium: 1, herb: 1 },
    objectives: ["Pollo al fuego directo", "Vegetales a las brasas"],
    sources: [
      {
        title: "McCormick Montreal Chicken: garlic, onion, salt, pepper and herbs",
        url: "https://www.mccormick.com/products/mccormick-r-grill-mates-r-montreal-chicken-seasoning-2-75-oz",
      },
    ],
  },
];

const pepperIds = new Set([
  "pimienta_negra",
  "pimienta_blanca",
  "pimienta_rosa",
  "pimienta_verde",
  "pimienta_larga",
]);

const toastedIds = new Set(["ajonjoli_blanco", "ajonjoli_negro", "cebolla_tostada"]);
const smokeIds = new Set(["chipotle_seco", "chile_morita", "paprika_ahumada"]);
const sweetSpiceIds = new Set([
  "anis_estrella",
  "canela_cassia",
  "cardamomo",
  "clavo_olor",
  "macis",
  "nuez_moscada",
  "pimienta_gorda",
]);
const earthyIds = new Set([
  "achiote",
  "chile_ancho",
  "chile_pasilla",
  "comino",
  "curcuma",
  "hinojo",
  "mostaza_polvo",
  "semilla_apio",
  "semilla_cilantro",
  "semilla_mostaza",
]);
const umamiIds = new Set([
  "ajo_negro",
  "cebolla_tostada",
  "levadura_nutricional",
  "porcini_seco",
  "shiitake_seco",
]);

export function getFlavorRoles(ingredient: Ingredient): FlavorRole[] {
  const roles = new Set<FlavorRole>();
  if (ingredient.id.startsWith("sal_") || ingredient.id === "flor_sal") roles.add("salinity");
  if (pepperIds.has(ingredient.id)) roles.add("pepper");
  if (ingredient.id.startsWith("ajo_") || ingredient.id.startsWith("cebolla_")) roles.add("allium");
  if (toastedIds.has(ingredient.id) || ingredient.familia === "Tostado") roles.add("toasted");
  if (smokeIds.has(ingredient.id)) roles.add("smoke");
  if (ingredient.familia === "Endulzante") roles.add("sweetener");
  if (sweetSpiceIds.has(ingredient.id)) roles.add("sweet_spice");
  if (ingredient.familia === "Hierba") roles.add("herb");
  if (earthyIds.has(ingredient.id)) roles.add("earthy");
  if (umamiIds.has(ingredient.id) || ingredient.familia === "Umami") roles.add("umami");
  if (ingredient.familia === "Citrico") roles.add("citrus");
  if (ingredient.familia === "Chile") roles.add("chile");
  return [...roles];
}

function roleInventory(selectedIngredients: Ingredient[]) {
  const inventory = new Map<FlavorRole, Ingredient[]>();
  for (const ingredient of selectedIngredients) {
    for (const role of getFlavorRoles(ingredient)) {
      inventory.set(role, [...(inventory.get(role) ?? []), ingredient]);
    }
  }
  return inventory;
}

function templateScore(
  template: FormulaTemplate,
  inventory: Map<FlavorRole, Ingredient[]>,
  objective: string,
) {
  const requirements = Object.entries(template.required) as Array<[FlavorRole, number]>;
  const matched = requirements.filter(([role, count]) => (inventory.get(role)?.length ?? 0) >= count);
  const objectiveFit = !template.objectives || template.objectives.includes(objective);
  return {
    exact: matched.length === requirements.length && objectiveFit,
    coverage: matched.length / requirements.length,
    matched,
    missing: requirements.filter(([role, count]) => (inventory.get(role)?.length ?? 0) < count),
    specificity: requirements.reduce((total, [, count]) => total + count, 0),
    objectiveFit,
  };
}

export function buildFormulaEvidence(
  selectedIngredients: Ingredient[],
  objective: string,
): FormulaEvidence {
  const inventory = roleInventory(selectedIngredients);
  const ranked = formulaTemplates
    .map((template) => ({ template, ...templateScore(template, inventory, objective) }))
    .sort((left, right) => {
      if (left.exact !== right.exact) return left.exact ? -1 : 1;
      if (left.coverage !== right.coverage) return right.coverage - left.coverage;
      return right.specificity - left.specificity;
    });
  const best = ranked[0];
  const objectiveMismatch = !best.objectiveFit;
  const level: FormulaEvidence["level"] = best.exact
    ? "referenced"
    : best.coverage >= 2 / 3 &&
        (best.missing.length === 1 || (best.missing.length === 0 && objectiveMismatch))
      ? "close"
      : "experimental";
  const requiredRoles = new Set(Object.keys(best.template.required) as FlavorRole[]);
  const additionalProfiles = [...inventory.entries()]
    .filter(([role]) => !requiredRoles.has(role))
    .map(([role, roleIngredients]) => ({
      role: roleLabels[role],
      ingredients: roleIngredients.map((ingredient) => ingredient.nombre),
      contribution: contributionByRole[role],
    }));
  const matchedRoles = best.matched.map(([role, count]) => {
    const observed = inventory.get(role)?.length ?? 0;
    return `${roleLabels[role]} (${observed}/${count})`;
  });
  const missingRoles = best.missing.map(([role, count]) => `${roleLabels[role]} (${count})`);
  if (objectiveMismatch && best.template.objectives) {
    missingRoles.push(`objetivo respaldado: ${best.template.objectives.join(" o ")}`);
  }
  const extrasText = additionalProfiles.length
    ? ` Los perfiles adicionales son: ${additionalProfiles
        .map(
          (profile) =>
            `${profile.role} mediante ${profile.ingredients.join(", ")} (${profile.contribution})`,
        )
        .join("; ")}.`
    : " No contiene perfiles fuera de la estructura de referencia.";
  const limitations: string[] = [];
  if (best.missing.length > 0) {
    limitations.push(
      `faltan ${best.missing.map(([role, count]) => `${roleLabels[role]} (${count})`).join(", ")}`,
    );
  }
  if (objectiveMismatch && best.template.objectives) {
    limitations.push(
      `la evidencia consultada corresponde a ${best.template.objectives.join(" o ")}, no a ${objective}`,
    );
  }

  let conclusion: string;
  if (level === "referenced") {
    conclusion = `La selección reproduce los roles de la fórmula documentada “${best.template.name}” (${best.template.description}). La estructura tiene precedentes culinarios publicados, aunque Lumbre todavía debe validar proporciones, temperatura y resultado sensorial.${extrasText}`;
  } else if (level === "close") {
    conclusion = `La selección es una variación cercana de “${best.template.name}”, pero ${limitations.join(" y ")}. Puede funcionar como hipótesis, no como fórmula confirmada, hasta comparar contra la referencia completa.${extrasText}`;
  } else {
    conclusion = `La selección no cubre suficientemente una fórmula de referencia. Su combinación debe tratarse como experimental y compararse contra un control antes de atribuirle un resultado esperado.${extrasText}`;
  }

  return {
    level,
    formula_id: level === "experimental" ? null : best.template.id,
    formula_name: level === "experimental" ? "Sin fórmula de referencia" : best.template.name,
    conclusion,
    matched_roles: matchedRoles,
    missing_roles: missingRoles,
    additional_profiles: additionalProfiles,
    sources: level === "experimental" ? [] : best.template.sources,
  };
}

const sensoryLabels: Record<string, string> = {
  salado: "salado",
  dulce: "dulce",
  acido: "ácido",
  amargo: "amargo",
  umami: "umami",
  picante: "picante",
  ahumado: "ahumado",
  herbal: "herbal",
  citrico: "cítrico",
  terroso: "terroso",
};

export function buildExpectedProfile(selectedIngredients: Ingredient[]): ExpectedProfile[] {
  const attributes = Object.keys(sensoryLabels);
  return attributes
    .map((attribute) => {
      const contributors = selectedIngredients.filter(
        (ingredient) => (ingredient.perfil_sensorial[attribute] ?? 0) >= 3,
      );
      const intensity =
        selectedIngredients.reduce(
          (total, ingredient) => total + (ingredient.perfil_sensorial[attribute] ?? 0),
          0,
        ) / selectedIngredients.length;
      return {
        attribute: sensoryLabels[attribute],
        intensity: Number(intensity.toFixed(1)),
        ingredients: contributors.map((ingredient) => ingredient.nombre),
      };
    })
    .filter((profile) => profile.intensity >= 1.5)
    .sort((left, right) => right.intensity - left.intensity)
    .slice(0, 4);
}
