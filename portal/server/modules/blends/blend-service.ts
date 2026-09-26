import { and, desc, eq, not } from "drizzle-orm";
import {
  createExperimentProtocol,
  ingredients,
  type ExperimentProtocol,
} from "../../../app/lib/ingredients";
import {
  experimentObjectives,
  findOrCreateHypothesis,
  type ExperimentObjective,
} from "../../../app/lib/hypothesis-store";
import { getDatabase } from "../../platform/database/client";
import {
  administrativeAuditEvents,
  userBlends,
} from "../../platform/database/schema";
import type { CreateBlendInput, ModerateBlendInput } from "./blend-contracts";

export type BlendStatus = "draft" | "submitted" | "published" | "rejected" | "archived";

export type UserBlendView = {
  id: string;
  title: string;
  objective: string;
  status: BlendStatus;
  protocol: ExperimentProtocol;
  moderationNote: string | null;
  publishedHypothesisId: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
};

export class BlendNotFoundError extends Error {}
export class BlendConflictError extends Error {}
export class BlendIngredientError extends Error {}

function projectBlend(row: typeof userBlends.$inferSelect): UserBlendView {
  return {
    id: row.id,
    title: row.title,
    objective: row.objective,
    status: row.status,
    protocol: JSON.parse(row.recordJson) as ExperimentProtocol,
    moderationNote: row.moderationNote,
    publishedHypothesisId: row.publishedHypothesisId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt,
    publishedAt: row.publishedAt,
  };
}

function selectedIngredients(ids: string[]) {
  const selected = ids.map((id) => ingredients.find((ingredient) => ingredient.id === id));
  if (selected.some((ingredient) => ingredient === undefined)) {
    throw new BlendIngredientError("Every ingredient must exist in the catalog");
  }
  return selected.map((ingredient) => ingredient!);
}

export async function listUserBlends(userId: string): Promise<UserBlendView[]> {
  const rows = await getDatabase()
    .select()
    .from(userBlends)
    .where(and(eq(userBlends.userId, userId), not(eq(userBlends.status, "archived"))))
    .orderBy(desc(userBlends.updatedAt));
  return rows.map(projectBlend);
}

export async function createUserBlend(
  userId: string,
  input: CreateBlendInput,
): Promise<{ data: UserBlendView; created: boolean }> {
  const selected = selectedIngredients(input.ingredient_ids);
  const objectiveConfiguration = experimentObjectives[input.objective];
  const signature = `${objectiveConfiguration.prefix}:${[...input.ingredient_ids].sort().join("+")}`;
  const database = getDatabase();
  const existing = await database
    .select()
    .from(userBlends)
    .where(and(eq(userBlends.userId, userId), eq(userBlends.signature, signature)))
    .get();

  if (existing) {
    if (existing.status === "archived") {
      const now = new Date().toISOString();
      const [restored] = await database
        .update(userBlends)
        .set({ status: "draft", title: input.title, updatedAt: now })
        .where(eq(userBlends.id, existing.id))
        .returning();
      return { data: projectBlend(restored), created: false };
    }
    return { data: projectBlend(existing), created: false };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const protocol = createExperimentProtocol(
    `BLD-${id.slice(0, 8).toUpperCase()}`,
    signature,
    selected,
    input.objective,
  );
  const [created] = await database
    .insert(userBlends)
    .values({
      id,
      userId,
      signature,
      title: input.title,
      objective: input.objective,
      recordJson: JSON.stringify(protocol),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return { data: projectBlend(created), created: true };
}

async function ownedBlend(userId: string, blendId: string) {
  const row = await getDatabase()
    .select()
    .from(userBlends)
    .where(and(eq(userBlends.id, blendId), eq(userBlends.userId, userId)))
    .get();
  if (!row) throw new BlendNotFoundError("Blend not found");
  return row;
}

export async function submitUserBlend(userId: string, blendId: string): Promise<UserBlendView> {
  const current = await ownedBlend(userId, blendId);
  if (!(["draft", "rejected"] as BlendStatus[]).includes(current.status)) {
    throw new BlendConflictError("Only draft or rejected blends can be submitted");
  }
  const now = new Date().toISOString();
  const [updated] = await getDatabase()
    .update(userBlends)
    .set({
      status: "submitted",
      moderationNote: null,
      submittedAt: now,
      updatedAt: now,
    })
    .where(eq(userBlends.id, blendId))
    .returning();
  return projectBlend(updated);
}

export async function archiveUserBlend(userId: string, blendId: string): Promise<void> {
  const current = await ownedBlend(userId, blendId);
  if (current.status === "submitted") {
    throw new BlendConflictError("A submitted blend cannot be archived while under review");
  }
  await getDatabase()
    .update(userBlends)
    .set({ status: "archived", updatedAt: new Date().toISOString() })
    .where(eq(userBlends.id, blendId));
}

export async function listBlendsForModeration(): Promise<UserBlendView[]> {
  const rows = await getDatabase()
    .select()
    .from(userBlends)
    .where(eq(userBlends.status, "submitted"))
    .orderBy(desc(userBlends.submittedAt));
  return rows.map(projectBlend);
}

export async function moderateUserBlend(
  actorUserId: string,
  blendId: string,
  input: ModerateBlendInput,
): Promise<UserBlendView> {
  const database = getDatabase();
  const current = await database.select().from(userBlends).where(eq(userBlends.id, blendId)).get();
  if (!current) throw new BlendNotFoundError("Blend not found");
  if (current.status !== "submitted") {
    throw new BlendConflictError("Only submitted blends can be moderated");
  }

  const now = new Date().toISOString();
  let publishedHypothesisId: string | null = null;
  if (input.decision === "approve") {
    const draft = JSON.parse(current.recordJson) as ExperimentProtocol;
    const objective = current.objective as ExperimentObjective;
    const selected = selectedIngredients(draft.componentes.map((component) => component.id));
    const publication = await findOrCreateHypothesis(
      current.signature,
      objective,
      (id) => createExperimentProtocol(id, current.signature, selected, objective),
    );
    publishedHypothesisId = publication.record.id;
  }

  const [updated] = await database
    .update(userBlends)
    .set({
      status: input.decision === "approve" ? "published" : "rejected",
      moderationNote: input.note ?? null,
      publishedHypothesisId,
      publishedAt: input.decision === "approve" ? now : null,
      updatedAt: now,
    })
    .where(eq(userBlends.id, blendId))
    .returning();

  await database.insert(administrativeAuditEvents).values({
    id: crypto.randomUUID(),
    actorUserId,
    resourceType: "blend",
    resourceId: blendId,
    action: "updated",
    beforeJson: JSON.stringify(current),
    afterJson: JSON.stringify(updated),
    createdAt: now,
  });
  return projectBlend(updated);
}

export async function resetUserBlends(): Promise<void> {
  await getDatabase().delete(userBlends);
}
