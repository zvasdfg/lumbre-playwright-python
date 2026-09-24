import { and, asc, eq } from "drizzle-orm";
import { getDatabase } from "../../platform/database/client";
import { firePlannerPresets } from "../../platform/database/schema";
import type { PresetInput } from "./preset-contracts";

const MAX_PRESETS = 20;

export type FirePresetView = {
  id: string;
  name: string;
  configuration: PresetInput["configuration"];
  createdAt: string;
  updatedAt: string;
};

export class PresetNotFoundError extends Error {}
export class PresetLimitError extends Error {}

function displayName(name: string): string {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function normalizedName(name: string): string {
  return displayName(name).toLocaleLowerCase("es-MX");
}

function projectPreset(row: typeof firePlannerPresets.$inferSelect): FirePresetView {
  return {
    id: row.id,
    name: row.name,
    configuration: {
      guests: row.guests,
      cookingStyle: row.cookingStyle,
      durationHours: row.durationHours as 2 | 4 | 6 | 8 | 12,
      fuelType: row.fuelType,
      equipment: row.equipment,
      weather: row.weather,
      servingTime: row.servingTime,
      includeVegetables: row.includeVegetables,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listFirePresets(userId: string): Promise<FirePresetView[]> {
  const rows = await getDatabase()
    .select()
    .from(firePlannerPresets)
    .where(eq(firePlannerPresets.userId, userId))
    .orderBy(asc(firePlannerPresets.createdAt));
  return rows.map(projectPreset);
}

export async function saveFirePreset(
  userId: string,
  input: PresetInput,
): Promise<{ data: FirePresetView; created: boolean }> {
  const database = getDatabase();
  const canonicalName = displayName(input.name);
  const canonicalKey = normalizedName(input.name);
  const existing = await database
    .select()
    .from(firePlannerPresets)
    .where(
      and(
        eq(firePlannerPresets.userId, userId),
        eq(firePlannerPresets.normalizedName, canonicalKey),
      ),
    )
    .get();
  const now = new Date().toISOString();
  const values = {
    name: canonicalName,
    normalizedName: canonicalKey,
    ...input.configuration,
    updatedAt: now,
  };

  if (existing) {
    await database
      .update(firePlannerPresets)
      .set(values)
      .where(eq(firePlannerPresets.id, existing.id));
    const updated = await database
      .select()
      .from(firePlannerPresets)
      .where(eq(firePlannerPresets.id, existing.id))
      .get();
    return { data: projectPreset(updated!), created: false };
  }

  const current = await listFirePresets(userId);
  if (current.length >= MAX_PRESETS) {
    throw new PresetLimitError(`An account can store at most ${MAX_PRESETS} presets`);
  }
  const id = crypto.randomUUID();
  await database
    .insert(firePlannerPresets)
    .values({
      id,
      userId,
      ...values,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: [firePlannerPresets.userId, firePlannerPresets.normalizedName],
      set: values,
    });
  const created = await database
    .select()
    .from(firePlannerPresets)
    .where(
      and(
        eq(firePlannerPresets.userId, userId),
        eq(firePlannerPresets.normalizedName, canonicalKey),
      ),
    )
    .get();
  return { data: projectPreset(created!), created: true };
}

export async function syncLocalFirePresets(
  userId: string,
  inputs: PresetInput[],
): Promise<{ data: FirePresetView[]; count: number; imported: number; skipped: number }> {
  const current = await listFirePresets(userId);
  const knownNames = new Set(current.map((preset) => normalizedName(preset.name)));
  let imported = 0;
  let skipped = 0;
  for (const input of inputs) {
    const inputName = normalizedName(input.name);
    if (knownNames.has(inputName) || knownNames.size >= MAX_PRESETS) {
      skipped += 1;
      continue;
    }
    await saveFirePreset(userId, input);
    knownNames.add(inputName);
    imported += 1;
  }
  const data = await listFirePresets(userId);
  return { data, count: data.length, imported, skipped };
}

export async function deleteFirePreset(userId: string, presetId: string): Promise<void> {
  const database = getDatabase();
  const owned = await database
    .select({ id: firePlannerPresets.id })
    .from(firePlannerPresets)
    .where(
      and(
        eq(firePlannerPresets.id, presetId),
        eq(firePlannerPresets.userId, userId),
      ),
    )
    .get();
  if (!owned) throw new PresetNotFoundError("Fire-planner preset not found");
  await database.delete(firePlannerPresets).where(eq(firePlannerPresets.id, presetId));
}

export async function resetFirePresets(): Promise<void> {
  await getDatabase().delete(firePlannerPresets);
}
