import { and, asc, desc, eq, sql } from "drizzle-orm";
import { events as eventSeeds, products as productSeeds } from "../../../app/lib/data";
import { getDatabase } from "../../platform/database/client";
import {
  administrativeAuditEvents,
  catalogEvents,
  catalogProducts,
  eventReservations,
} from "../../platform/database/schema";
import type {
  CreateEventInput,
  CreateProductInput,
  UpdateEventInput,
  UpdateProductInput,
} from "./admin-contracts";

export class CatalogResourceNotFoundError extends Error {}
export class CatalogRevisionConflictError extends Error {}
export class EventCapacityConflictError extends Error {}
export class CatalogValidationError extends Error {}

export type ProductRecord = typeof catalogProducts.$inferSelect;
export type EventRecord = typeof catalogEvents.$inferSelect;

function publicProduct(product: ProductRecord) {
  const metadata = product.details;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    ...(product.badge ? { badge: product.badge } : {}),
    ...(metadata ? {
      productCode: metadata.productCode, description: metadata.description,
      image: metadata.image, imageAlt: metadata.imageAlt, netContent: metadata.netContent,
      ingredients: metadata.components.map((item) => item.nombre),
    } : {}),
    purchaseEnabled: product.stock > 0 && product.price > 0,
  };
}

async function recordAudit(
  actorUserId: string,
  resourceType: "product" | "event",
  resourceId: number,
  action: "created" | "updated",
  before: ProductRecord | EventRecord | null,
  after: ProductRecord | EventRecord,
) {
  await getDatabase().insert(administrativeAuditEvents).values({
    id: crypto.randomUUID(),
    actorUserId,
    resourceType,
    resourceId: String(resourceId),
    action,
    beforeJson: before ? JSON.stringify(before) : null,
    afterJson: JSON.stringify(after),
    createdAt: new Date().toISOString(),
  });
}

async function nextIdentifier(table: "product" | "event"): Promise<number> {
  const target = table === "product" ? catalogProducts : catalogEvents;
  const row = await getDatabase()
    .select({ maximum: sql<number>`COALESCE(MAX(${target.id}), 0)` })
    .from(target)
    .get();
  return Math.max(Number(row?.maximum ?? 0) + 1, 1000);
}

export async function listPublicProducts() {
  const rows = await getDatabase()
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.active, true))
    .orderBy(
      sql`CASE
        WHEN ${catalogProducts.id} BETWEEN 121 AND 124 THEN 0
        WHEN ${catalogProducts.category} = 'blends' THEN 1
        ELSE 2
      END`,
      asc(catalogProducts.id),
    );
  return rows.map(publicProduct);
}

export async function findPublicProduct(productId: number) {
  const row = await getDatabase()
    .select()
    .from(catalogProducts)
    .where(and(eq(catalogProducts.id, productId), eq(catalogProducts.active, true)))
    .get();
  return row ? publicProduct(row) : null;
}

export async function listAdministrativeProducts() {
  return getDatabase().select().from(catalogProducts).orderBy(asc(catalogProducts.id));
}

export async function createProduct(actorUserId: string, input: CreateProductInput) {
  if (input.details) {
    const duplicate = await getDatabase().select({ id: catalogProducts.id }).from(catalogProducts)
      .where(sql`json_extract(${catalogProducts.details}, '$.productCode') = ${input.details.productCode}`).get();
    if (duplicate) throw new CatalogRevisionConflictError("Product code already exists");
  }
  const now = new Date().toISOString();
  const id = await nextIdentifier("product");
  const [created] = await getDatabase()
    .insert(catalogProducts)
    .values({ id, ...input, stock: input.stock ?? 0, badge: input.badge ?? null, active: input.details?.publicationStatus === "draft" ? false : input.active ?? true, createdAt: now, updatedAt: now })
    .onConflictDoNothing()
    .returning();
  if (!created) throw new CatalogRevisionConflictError("Product identity already exists; reload the catalog");
  await recordAudit(actorUserId, "product", id, "created", null, created);
  return created;
}

export async function updateProduct(
  actorUserId: string,
  productId: number,
  input: UpdateProductInput,
) {
  const database = getDatabase();
  const before = await database
    .select()
    .from(catalogProducts)
    .where(eq(catalogProducts.id, productId))
    .get();
  if (!before) throw new CatalogResourceNotFoundError("Product not found");
  const { expectedRevision, ...changes } = input;
  if (changes.details && changes.details.publicationStatus === undefined && before.details?.publicationStatus) {
    changes.details.publicationStatus = before.details.publicationStatus;
  }
  // Existing declarations predate publicationStatus and are already public.
  if (before.details && before.details.publicationStatus !== "draft" && changes.details?.publicationStatus === "draft") {
    throw new CatalogValidationError("Published products can be archived, not returned to draft");
  }
  if ((changes.details ?? before.details)?.publicationStatus === "draft") {
    changes.active = false;
  }
  if (before.details && changes.details && changes.details.productCode !== before.details.productCode) {
    throw new CatalogValidationError("Published product codes cannot be changed");
  }
  if ((changes.category ?? before.category) === "blends" && !(changes.details ?? before.details)) {
    throw new CatalogValidationError("Blends require their public laboratory details");
  }
  const [updated] = await database
    .update(catalogProducts)
    .set({ ...changes, revision: expectedRevision + 1, updatedAt: new Date().toISOString() })
    .where(and(eq(catalogProducts.id, productId), eq(catalogProducts.revision, expectedRevision)))
    .returning();
  if (!updated) throw new CatalogRevisionConflictError("Product revision is stale");
  await recordAudit(actorUserId, "product", productId, "updated", before, updated);
  return updated;
}

export async function listAdministrativeEvents() {
  return getDatabase().select().from(catalogEvents).orderBy(asc(catalogEvents.id));
}

export async function listPublicEventRecords() {
  return getDatabase()
    .select()
    .from(catalogEvents)
    .where(eq(catalogEvents.active, true))
    .orderBy(asc(catalogEvents.id));
}

export async function findCatalogEvent(eventId: number) {
  return getDatabase()
    .select()
    .from(catalogEvents)
    .where(and(eq(catalogEvents.id, eventId), eq(catalogEvents.active, true)))
    .get();
}

export async function createEvent(actorUserId: string, input: CreateEventInput) {
  const now = new Date().toISOString();
  const id = await nextIdentifier("event");
  const [created] = await getDatabase()
    .insert(catalogEvents)
    .values({ id, ...input, active: input.active ?? true, createdAt: now, updatedAt: now })
    .returning();
  await recordAudit(actorUserId, "event", id, "created", null, created);
  return created;
}

export async function updateEvent(
  actorUserId: string,
  eventId: number,
  input: UpdateEventInput,
) {
  const database = getDatabase();
  const before = await database
    .select()
    .from(catalogEvents)
    .where(eq(catalogEvents.id, eventId))
    .get();
  if (!before) throw new CatalogResourceNotFoundError("Event not found");
  if (input.capacity !== undefined) {
    const reserved = await database
      .select({ total: sql<number>`COALESCE(SUM(${eventReservations.partySize}), 0)` })
      .from(eventReservations)
      .where(
        and(
          eq(eventReservations.eventId, eventId),
          eq(eventReservations.status, "confirmed"),
        ),
      )
      .get();
    if (input.capacity < Number(reserved?.total ?? 0)) {
      throw new EventCapacityConflictError("Capacity cannot be lower than confirmed reservations");
    }
  }
  const { expectedRevision, ...changes } = input;
  const [updated] = await database
    .update(catalogEvents)
    .set({ ...changes, revision: expectedRevision + 1, updatedAt: new Date().toISOString() })
    .where(and(eq(catalogEvents.id, eventId), eq(catalogEvents.revision, expectedRevision)))
    .returning();
  if (!updated) throw new CatalogRevisionConflictError("Event revision is stale");
  await recordAudit(actorUserId, "event", eventId, "updated", before, updated);
  return updated;
}

export async function listAuditEvents() {
  const rows = await getDatabase()
    .select()
    .from(administrativeAuditEvents)
    .orderBy(desc(administrativeAuditEvents.createdAt));
  return rows.map(({ beforeJson, afterJson, ...event }) => ({
    ...event,
    before: beforeJson ? JSON.parse(beforeJson) : null,
    after: JSON.parse(afterJson),
  }));
}

export async function resetCatalog(testStock = 0): Promise<void> {
  const database = getDatabase();
  await database.delete(administrativeAuditEvents);
  await database.delete(catalogProducts);
  await database.delete(catalogEvents);
  await database.insert(catalogProducts).values(
    productSeeds.map(({ id, name, category, price, stock, badge, details }) => ({
      id,
      name,
      category,
      price,
      stock: testStock || stock,
      badge: badge ?? null,
      details,
    })),
  );
  await database.insert(catalogEvents).values(
    eventSeeds.map(({ spots, ...event }) => ({ ...event, capacity: spots })),
  );
}
