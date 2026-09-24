import { desc, eq } from "drizzle-orm";
import { getDatabase } from "../../platform/database/client";
import {
  membershipConsentEvents,
  membershipPreferences,
} from "../../platform/database/schema";
import type { MembershipPreferenceInput } from "./preference-contracts";

const defaultPreferences: MembershipPreferenceInput = {
  preferredFuel: "carbon",
  equipment: "kettle",
  cookingStyle: "directo",
  defaultGuests: 6,
  newsletterConsent: false,
};

export type MembershipPreferenceView = MembershipPreferenceInput & {
  configured: boolean;
  updatedAt: string | null;
};

export type ConsentEventView = {
  id: string;
  channel: "newsletter";
  granted: boolean;
  recordedAt: string;
};

async function consentHistory(userId: string): Promise<ConsentEventView[]> {
  return getDatabase()
    .select({
      id: membershipConsentEvents.id,
      channel: membershipConsentEvents.channel,
      granted: membershipConsentEvents.granted,
      recordedAt: membershipConsentEvents.recordedAt,
    })
    .from(membershipConsentEvents)
    .where(eq(membershipConsentEvents.userId, userId))
    .orderBy(desc(membershipConsentEvents.recordedAt));
}

export async function getMembershipPreferences(userId: string) {
  const row = await getDatabase()
    .select()
    .from(membershipPreferences)
    .where(eq(membershipPreferences.userId, userId))
    .get();
  const data: MembershipPreferenceView = row
    ? {
        preferredFuel: row.preferredFuel,
        equipment: row.equipment,
        cookingStyle: row.cookingStyle,
        defaultGuests: row.defaultGuests,
        newsletterConsent: row.newsletterConsent,
        configured: true,
        updatedAt: row.updatedAt,
      }
    : { ...defaultPreferences, configured: false, updatedAt: null };
  return { data, consentHistory: await consentHistory(userId) };
}

export async function saveMembershipPreferences(
  userId: string,
  input: MembershipPreferenceInput,
) {
  const database = getDatabase();
  const existing = await database
    .select()
    .from(membershipPreferences)
    .where(eq(membershipPreferences.userId, userId))
    .get();
  const now = new Date().toISOString();
  const preferenceWrite = database
    .insert(membershipPreferences)
    .values({ userId, ...input, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: membershipPreferences.userId,
      set: { ...input, updatedAt: now },
    });
  const consentRecorded = !existing || existing.newsletterConsent !== input.newsletterConsent;

  if (consentRecorded) {
    const consentWrite = database.insert(membershipConsentEvents).values({
      id: crypto.randomUUID(),
      userId,
      channel: "newsletter",
      granted: input.newsletterConsent,
      recordedAt: now,
    });
    await database.batch([preferenceWrite, consentWrite]);
  } else {
    await preferenceWrite;
  }

  const result = await getMembershipPreferences(userId);
  return { ...result, created: !existing, consentRecorded };
}

export async function resetMembershipPreferences(): Promise<void> {
  const database = getDatabase();
  await database.delete(membershipConsentEvents);
  await database.delete(membershipPreferences);
}
