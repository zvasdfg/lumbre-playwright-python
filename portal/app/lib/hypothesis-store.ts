import { mkdir, open, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ExperimentProtocol } from "./ingredients";

export const experimentObjectives = {
  "Costra para res": { prefix: "LHC", subject: "una costra equilibrada para res" },
  "Bark para cocción lenta": { prefix: "LHB", subject: "un bark estable para cocción lenta" },
  "Vegetales a las brasas": { prefix: "LHV", subject: "vegetales cocinados a las brasas" },
  "Pollo al fuego directo": { prefix: "LHP", subject: "pollo cocinado a fuego directo" },
} as const;

export type ExperimentObjective = keyof typeof experimentObjectives;

function storageDirectory() {
  return process.env.LUMBRE_HYPOTHESIS_DIR ?? path.join(process.cwd(), "data", "hypotheses");
}

async function ensureStorageDirectory() {
  const directory = storageDirectory();
  await mkdir(directory, { recursive: true });
  return directory;
}

export async function listHypotheses(): Promise<ExperimentProtocol[]> {
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
  options: { refreshRecommended?: boolean } = {},
) {
  const directory = await ensureStorageDirectory();
  const { handle, lockPath } = await acquireWriteLock(directory);
  try {
    const records = await listHypotheses();
    const existing = records.find((record) => record.firma === signature);
    if (existing) {
      if (
        existing.schema_version !== 5 ||
        (options.refreshRecommended && existing.tipo_registro === "recomendacion_investigada")
      ) {
        const upgraded = { ...buildRecord(existing.id), creado_en: existing.creado_en };
        await writeFile(path.join(directory, `${existing.id}.json`), `${JSON.stringify(upgraded, null, 2)}\n`, {
          encoding: "utf8",
        });
        return { record: upgraded, created: false };
      }
      return { record: existing, created: false };
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
