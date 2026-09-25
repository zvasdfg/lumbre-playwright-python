import { eq } from "drizzle-orm";
import { type ExperimentProtocol } from "./ingredients";
import { getDatabase } from "../../server/platform/database/client";
import { hypotheses } from "../../server/platform/database/schema";

export const experimentObjectives = {
  "Costra para res": { prefix: "LHC", subject: "una costra equilibrada para res" },
  "Bark para cocción lenta": { prefix: "LHB", subject: "un bark estable para cocción lenta" },
  "Vegetales a las brasas": { prefix: "LHV", subject: "vegetales cocinados a las brasas" },
  "Pollo al fuego directo": { prefix: "LHP", subject: "pollo cocinado a fuego directo" },
} as const;

export type ExperimentObjective = keyof typeof experimentObjectives;

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

export async function listHypotheses(): Promise<ExperimentProtocol[]> {
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

export async function resetHypotheses(): Promise<void> {
  await getDatabase().delete(hypotheses);
}

export async function findOrCreateHypothesis(
  signature: string,
  objective: ExperimentObjective,
  buildRecord: (id: string) => ExperimentProtocol,
  options: { incrementDuplicateCount?: boolean } = {},
) {
  const database = getDatabase();
  const records = await listHypotheses();
  const existing = records.find((record) => record.firma === signature);
  if (existing) {
    const shouldRefresh = existing.schema_version !== 5;
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
