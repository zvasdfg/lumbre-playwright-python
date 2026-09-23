import { eq } from "drizzle-orm";
import { getDatabase } from "./client";
import { metadataKeys, systemMetadata } from "./schema";

export type DatabaseHealth = {
  status: "ready" | "seed-mismatch" | "unavailable";
  provider: "cloudflare-d1";
  seedVersion: string | null;
};

export async function getDatabaseHealth(
  expectedSeedVersion: string,
): Promise<DatabaseHealth> {
  try {
    const database = getDatabase();
    const metadata = await database
      .select({ value: systemMetadata.value })
      .from(systemMetadata)
      .where(eq(systemMetadata.key, metadataKeys.seedVersion))
      .get();
    const observedSeedVersion = metadata?.value ?? null;

    return {
      status: observedSeedVersion === expectedSeedVersion ? "ready" : "seed-mismatch",
      provider: "cloudflare-d1",
      seedVersion: observedSeedVersion,
    };
  } catch {
    return {
      status: "unavailable",
      provider: "cloudflare-d1",
      seedVersion: null,
    };
  }
}
