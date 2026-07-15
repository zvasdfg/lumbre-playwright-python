import { createExperimentProtocol, ingredients } from "../../lib/ingredients";
import {
  ensureRecommendedHypotheses,
  experimentObjectives,
  findOrCreateHypothesis,
  listHypotheses,
  type ExperimentObjective,
} from "../../lib/hypothesis-store";

type HypothesisRequest = {
  ingredient_ids?: unknown[];
  objective?: string;
};

export async function GET() {
  try {
    await ensureRecommendedHypotheses();
    const records = await listHypotheses();
    return Response.json({ data: records, count: records.length });
  } catch (error) {
    return Response.json(
      {
        error: "The recommended hypothesis registry could not be initialized",
        detail: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: HypothesisRequest;
  try {
    body = (await request.json()) as HypothesisRequest;
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
        error: "The hypothesis failed validation",
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
        createExperimentProtocol(id, signature, selectedIngredients, validatedObjective),
      { incrementDuplicateCount: true },
    );
    return Response.json(
      {
        data: record,
        created,
        duplicate: !created,
        duplicate_count: record.contador_repeticiones,
        validation: { valid: true, ingredients: ingredientValidation },
      },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    return Response.json(
      {
        error: "The local hypothesis registry could not be updated",
        detail: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
