import { mkdir, open, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createExperimentProtocol,
  ingredients,
  type ExperimentProtocol,
} from "./ingredients";
import { isProductionReadOnly } from "./environment";
import { hypothesisSeeds } from "./hypothesis-seeds";
import { recommendedFormulas } from "./recommended-formulas";

export const experimentObjectives = {
  "Costra para res": { prefix: "LHC", subject: "una costra equilibrada para res" },
  "Bark para cocción lenta": { prefix: "LHB", subject: "un bark estable para cocción lenta" },
  "Vegetales a las brasas": { prefix: "LHV", subject: "vegetales cocinados a las brasas" },
  "Pollo al fuego directo": { prefix: "LHP", subject: "pollo cocinado a fuego directo" },
} as const;

export type ExperimentObjective = keyof typeof experimentObjectives;

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

function storageDirectory() {
  return process.env.LUMBRE_HYPOTHESIS_DIR ?? path.join(process.cwd(), "data", "hypotheses");
}

async function ensureStorageDirectory() {
  const directory = storageDirectory();
  await mkdir(directory, { recursive: true });
  return directory;
}

export async function listHypotheses(): Promise<ExperimentProtocol[]> {
  if (isProductionReadOnly()) {
    return hypothesisSeeds
      .map((record) => structuredClone(record))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  const directory = await ensureStorageDirectory();
  const entries = await readdir(directory);
  const records = await Promise.all(
    entries
      .filter((entry) => /^LH[CBVP]-\d{3}\.json$/.test(entry))
      .map(async (entry) => {
        const content = await readFile(path.join(directory, entry), "utf8");
        return JSON.parse(content) as ExperimentProtocol;
      }),
  );
  return records.sort((left, right) => left.id.localeCompare(right.id));
}

async function acquireWriteLock(directory: string) {
  const lockPath = path.join(directory, ".write.lock");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");
      return { handle, lockPath };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error("The hypothesis registry is busy; retry the request");
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

  const directory = await ensureStorageDirectory();
  const { handle, lockPath } = await acquireWriteLock(directory);
  try {
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
        await writeFile(path.join(directory, `${existing.id}.json`), `${JSON.stringify(resolvedRecord, null, 2)}\n`, {
          encoding: "utf8",
        });
      }
      return { record: resolvedRecord, created: false };
    }

    const { prefix } = experimentObjectives[objective];
    const lastSequence = records
      .filter((record) => record.id.startsWith(`${prefix}-`))
      .reduce((highest, record) => Math.max(highest, Number(record.id.slice(-3))), 0);
    const id = `${prefix}-${String(lastSequence + 1).padStart(3, "0")}`;
    const record = buildRecord(id);
    await writeFile(path.join(directory, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    return { record, created: true };
  } finally {
    await handle.close();
    await unlink(lockPath).catch(() => undefined);
  }
}
