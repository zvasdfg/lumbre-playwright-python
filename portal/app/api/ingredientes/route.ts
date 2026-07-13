import {
  createExperimentProtocol,
  ingredientFamilies,
  ingredients,
} from "../../lib/ingredients";
import {
  experimentObjectives,
  findOrCreateHypothesis,
  listHypotheses,
  type ExperimentObjective,
} from "../../lib/hypothesis-store";
import { recommendedFormulas } from "../../lib/recommended-formulas";

type ExperimentRequest = {
  ingredient_ids?: unknown[];
  objective?: string;
};

async function ensureRecommendedFormulas() {
  for (const recommendation of recommendedFormulas) {
    const selectedIngredients = recommendation.ingredientIds.map((ingredientId) => {
      const ingredient = ingredients.find((candidate) => candidate.id === ingredientId);
      if (!ingredient) {
        throw new Error(
          `Recommended formula '${recommendation.id}' references missing ingredient '${ingredientId}'`,
        );
      }
      return ingredient;
    });
    const prefix = experimentObjectives[recommendation.objective].prefix;
    const signature = `${prefix}:${[...recommendation.ingredientIds].sort().join("+")}`;
    await findOrCreateHypothesis(
      signature,
      recommendation.objective,
      (id) =>
        createExperimentProtocol(
          id,
          signature,
          selectedIngredients,
          recommendation.objective,
          {
            status: "recomendado_sin_validar",
            registryType: "recomendacion_investigada",
            hypothesis: recommendation.hypothesis,
            recommendation: {
              id: recommendation.id,
              nombre: recommendation.name,
              fundamento: recommendation.rationale,
              adaptacion: recommendation.adaptation,
              proporciones: recommendation.proportions.map(({ ingredientId, parts }) => ({
                ingrediente_id: ingredientId,
                partes: parts,
              })),
              fuentes: recommendation.sources.map(({ title, url }) => ({ titulo: title, url })),
            },
          },
        ),
      { refreshRecommended: true },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("hipotesis") === "true") {
    try {
      await ensureRecommendedFormulas();
      const records = await listHypotheses();
      return Response.json({ data: records, count: records.length });
    } catch (error) {
      return Response.json(
        { error: "The recommended formula registry could not be initialized", detail: (error as Error).message },
        { status: 500 },
      );
    }
  }
  const id = searchParams.get("id");
  const family = searchParams.get("familia");
  const status = searchParams.get("estado");
  const query = searchParams.get("q")?.trim().toLocaleLowerCase("es") ?? "";

  if (id) {
    const ingredient = ingredients.find((item) => item.id === id);
    if (!ingredient) {
      return Response.json({ error: `Ingredient '${id}' was not found` }, { status: 404 });
    }
    return Response.json({ data: ingredient });
  }

  const result = ingredients.filter((ingredient) => {
    const matchesFamily = !family || family === "todas" || ingredient.familia === family;
    const matchesStatus = !status || ingredient.estado === status;
    const matchesQuery =
      !query ||
      `${ingredient.nombre} ${ingredient.familia}`.toLocaleLowerCase("es").includes(query);
    return matchesFamily && matchesStatus && matchesQuery;
  });

  return Response.json({
    data: result,
    count: result.length,
    total: ingredients.length,
    families: ingredientFamilies,
  });
}

export async function POST(request: Request) {
  let body: ExperimentRequest;
  try {
    body = (await request.json()) as ExperimentRequest;
  } catch {
    return Response.json({ error: "A valid JSON body is required" }, { status: 400 });
  }

  const ingredientIds = body.ingredient_ids;
  const objective = body.objective?.trim() ?? "";
  const requestErrors: string[] = [];

  if (!Array.isArray(ingredientIds)) {
    return Response.json(
      { error: "ingredient_ids must be an array", validation: { valid: false } },
      { status: 422 },
    );
  }
  if (ingredientIds.length < 2 || ingredientIds.length > 6) {
    requestErrors.push("ingredient_ids must contain between 2 and 6 ingredients");
  }
  if (!(objective in experimentObjectives)) {
    requestErrors.push("objective must be one of the supported technical-sheet objectives");
  }

  const ingredientValidation = ingredientIds.map((value, index) => {
    const errors: string[] = [];
    if (typeof value !== "string" || !/^[a-z0-9_]+$/.test(value)) {
      errors.push("must be a non-empty ingredient id using lowercase letters, numbers, or underscores");
    }
    if (typeof value === "string" && ingredientIds.indexOf(value) !== index) {
      errors.push("is duplicated in this formula");
    }
    const ingredient =
      typeof value === "string"
        ? ingredients.find((candidate) => candidate.id === value)
        : undefined;
    if (typeof value === "string" && !ingredient) errors.push("does not exist in the catalog");
    return {
      position: index,
      id: value,
      name: ingredient?.nombre ?? null,
      valid: errors.length === 0,
      errors,
    };
  });

  if (requestErrors.length || ingredientValidation.some((item) => !item.valid)) {
    return Response.json(
      {
        error: "The formula failed validation",
        validation: { valid: false, errors: requestErrors, ingredients: ingredientValidation },
      },
      { status: 422 },
    );
  }

  const validatedIds = ingredientIds as string[];
  const selectedIngredients = validatedIds.map(
    (id) => ingredients.find((ingredient) => ingredient.id === id)!,
  );
  const validatedObjective = objective as ExperimentObjective;
  const objectiveConfiguration = experimentObjectives[validatedObjective];
  const signature = `${objectiveConfiguration.prefix}:${[...validatedIds].sort().join("+")}`;

  try {
    const { record, created } = await findOrCreateHypothesis(
      signature,
      validatedObjective,
      (id) =>
        createExperimentProtocol(
          id,
          signature,
          selectedIngredients,
          validatedObjective,
        ),
    );
    return Response.json(
      {
        data: record,
        created,
        duplicate: !created,
        validation: { valid: true, ingredients: ingredientValidation },
      },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    return Response.json(
      { error: "The local hypothesis registry could not be updated", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
