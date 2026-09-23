import { eq } from "drizzle-orm";
import {
  createExperimentProtocol,
  ingredients,
  type ExperimentProtocol,
} from "./ingredients";
import { isProductionReadOnly } from "./environment";
import { hypothesisSeeds } from "./hypothesis-seeds";
import { recommendedFormulas } from "./recommended-formulas";
import { getDatabase } from "../../server/platform/database/client";
import { hypotheses } from "../../server/platform/database/schema";

export const experimentObjectives = {
  "Costra para res": { prefix: "LHC", subject: "una costra equilibrada para res" },
  "Bark para cocción lenta": { prefix: "LHB", subject: "un bark estable para cocción lenta" },
  "Vegetales a las brasas": { prefix: "LHV", subject: "vegetales cocinados a las brasas" },
  "Pollo al fuego directo": { prefix: "LHP", subject: "pollo cocinado a fuego directo" },
} as const;

export type ExperimentObjective = keyof typeof experimentObjectives;

let seedPromise: Promise<void> | null = null;

function serializeRecord(record: ExperimentProtocol) {
  return JSON.stringify(record);
}

function parseRecord(recordJson: string, duplicateCount: number): ExperimentProtocol {
  return {
    ...(JSON.parse(recordJson) as ExperimentProtocol),
    contador_repeticiones: duplicateCount,
  };
}

function seedValues(record: ExperimentProtocol) {
  return {
    id: record.id,
    signature: record.firma,
    objective: record.objetivo,
    recordJson: serializeRecord(record),
    duplicateCount: record.contador_repeticiones ?? 0,
    createdAt: record.creado_en,
    updatedAt: record.creado_en,
  };
}

async function ensureBundledHypotheses() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const database = getDatabase();
      const batchSize = 10;
      for (let index = 0; index < hypothesisSeeds.length; index += batchSize) {
        const batch = hypothesisSeeds.slice(index, index + batchSize).map(seedValues);
        await database.insert(hypotheses).values(batch).onConflictDoNothing();
      }
    })().catch((error) => {
        seedPromise = null;
        throw error;
      });
  }

  await seedPromise;
}

export async function ensureRecommendedHypotheses() {
  if (isProductionReadOnly()) return;

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

export async function listHypotheses(): Promise<ExperimentProtocol[]> {
  if (isProductionReadOnly()) {
    return hypothesisSeeds
      .map((record) => structuredClone(record))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  await ensureBundledHypotheses();
  const rows = await getDatabase()
    .select({
      recordJson: hypotheses.recordJson,
      duplicateCount: hypotheses.duplicateCount,
    })
    .from(hypotheses);

  return rows
    .map((row) => parseRecord(row.recordJson, row.duplicateCount))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export async function findOrCreateHypothesis(
  signature: string,
  objective: ExperimentObjective,
  buildRecord: (id: string) => ExperimentProtocol,
  options: { refreshRecommended?: boolean; incrementDuplicateCount?: boolean } = {},
) {
  if (isProductionReadOnly()) {
    throw new Error("The production hypothesis registry is read-only");
  }

  const database = getDatabase();
  const records = await listHypotheses();
  const existing = records.find((record) => record.firma === signature);
  if (existing) {
    const shouldRefresh =
      existing.schema_version !== 5 ||
      (options.refreshRecommended && existing.tipo_registro === "recomendacion_investigada");
    const currentDuplicateCount = existing.contador_repeticiones ?? 0;
    let resolvedRecord = shouldRefresh
      ? {
          ...buildRecord(existing.id),
          creado_en: existing.creado_en,
          contador_repeticiones: currentDuplicateCount,
        }
      : { ...existing, contador_repeticiones: currentDuplicateCount };

    if (options.incrementDuplicateCount) {
      resolvedRecord = {
        ...resolvedRecord,
        contador_repeticiones: currentDuplicateCount + 1,
      };
    }

    if (shouldRefresh || options.incrementDuplicateCount) {
      await database
        .update(hypotheses)
        .set({
          objective: resolvedRecord.objetivo,
          recordJson: serializeRecord(resolvedRecord),
          duplicateCount: resolvedRecord.contador_repeticiones,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(hypotheses.id, existing.id));
    }
    return { record: resolvedRecord, created: false };
  }

  const { prefix } = experimentObjectives[objective];
  const lastSequence = records
    .filter((record) => record.id.startsWith(`${prefix}-`))
    .reduce((highest, record) => Math.max(highest, Number(record.id.slice(-3))), 0);
  const id = `${prefix}-${String(lastSequence + 1).padStart(3, "0")}`;
  const record = buildRecord(id);

  try {
    await database.insert(hypotheses).values(seedValues(record));
    return { record, created: true };
  } catch (error) {
    const concurrent = await database
      .select({
        recordJson: hypotheses.recordJson,
        duplicateCount: hypotheses.duplicateCount,
      })
      .from(hypotheses)
      .where(eq(hypotheses.signature, signature))
      .get();
    if (concurrent) {
      return {
        record: parseRecord(concurrent.recordJson, concurrent.duplicateCount),
        created: false,
      };
    }
    throw error;
  }
}
